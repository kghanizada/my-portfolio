<script>
    import * as d3 from "d3";

    export let data = [];
    export let selectedIndex = -1;
    export let colors = d3.scaleOrdinal(d3.schemeTableau10); // Export colors scale

    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let sliceGenerator = d3
        .pie()
        .value((d) => d.value)
        .sort(null);
    let transitionDuration = 1000;

    // Declare variables
    let arcData = [];
    let arcs = [];
    let wedges = {};
    let oldData = [];

    // Use a reactive statement to recalculate arcData and arcs when data changes
    $: {
        arcData = d3.pie().value((d) => d.value)(data);
        arcs = arcData.map((d) => arcGenerator(d));
    }

    function toggleWedge(index, event) {
        // Check if the event is triggered by Enter key or if event.key doesn't exist (for mouse click)
        if (!event.key || event.key === "Enter") {
            selectedIndex = selectedIndex === index ? -1 : index;
        }
    }

    function transitionArcs() {
        // TODO Transition all arcs
        let wedgeElements = Object.values(wedges);

        d3.selectAll(wedgeElements)
            .transition("arc")
            .duration(transitionDuration)
            .styleTween("d", function (_, index) {
                let wedge = this;
                let label = Object.keys(wedges)[index];
                let transition = transitionArc(wedge, label);
                return transition?.interpolator;
            });
    }

    function getEmptyArc(label, data = pieData) {
        // Union of old and new labels in the order they appear
        let labels = d3.sort(
            new Set([...oldData, ...pieData].map((d) => d.label)),
        );
        let labelIndex = labels.indexOf(label);
        let sibling;
        for (let i = labelIndex - 1; i >= 0; i--) {
            sibling = data.find((d) => d.label === labels[i]);
            if (sibling) {
                break;
            }
        }

        let angle = sibling?.endAngle ?? 0;
        return { startAngle: angle, endAngle: angle };
    }

    function arc(wedge) {
        // Calculations that will only be done once per element go here
        // TODO use transitionArc() to get the data you need
        let label = Object.keys(wedges).find((key) => wedges[key] === wedge);
        let transition = transitionArc(wedge, label);
        if (!transition) return null;

        return {
            duration: transition.duration,
            css: (t, u) => {
                // t is a number between 0 and 1 that represents the transition progress; u is 1 - t
                return `d: ${transition.interpolator(t)}`;
            },
        };
    }

    function transitionArc(wedge, label) {
        label ??= Object.entries(wedges).find(([label, w]) => w === wedge)[0];

        let d = pieData.find((d) => d.label === label);
        let d_old = oldData.find((d) => d.label === label);

        if (!d || !d_old) {
            return;
        }

        let type = d ? (d_old ? "update" : "in") : "out";

        if (sameArc(d_old, d)) {
            return null;
        }

        let from = d_old ? { ...d_old } : getEmptyArc(label, oldData);
        let to = { ...d };
        let angleInterpolator = d3.interpolate(from, to);

        let interpolator = (t) =>
            `path("${arcGenerator(angleInterpolator(t))}")`;

        // Calculations that will only be done once per element go here
        return { d, d_old, from, to, interpolator };
        // t is a number between 0 and 1 that represents the transition progress
        // TODO Interpolate the angles and return the path string that corresponds to
    }

    function sameArc(arc1, arc2) {
        if (!arc1 || !arc2) {
            return true;
        }
        return (
            arc1.startAngle === arc2.startAngle &&
            arc1.endAngle === arc2.endAngle
        );
    }

    let pieData;
    $: {
        oldData = pieData;
        pieData = d3.sort(data, (d) => d.label);
        pieData = pieData.map((d, i) => ({
            ...d,
            ...arcData[i],
            arc: arcs[i],
        }));
        transitionArcs();
    }
</script>

<main>
    <div class="container">
        <svg viewBox="-50 -50 100 100">
            {#each pieData as d, index (d.label)}
                <path
                    bind:this={wedges[d.label]}
                    d={d.arc}
                    fill={colors(d.id ?? d.label)}
                    class:selected={selectedIndex === index}
                    style="
                        --start-angle: {d.arc.startAngle}rad;
                        --end-angle: {d.arc.endAngle}rad;"
                    tabindex="0"
                    role="button"
                    aria-label={`Select ${d.label}`}
                    on:click={(e) => toggleWedge(index, e)}
                    on:keyup={(e) => toggleWedge(index, e)}
                    transition:arc
                />
            {/each}
        </svg>

        <ul class="legend">
            {#each pieData as d, index}
                <li style="--color: {colors(d.id ?? d.label)}">
                    <span
                        class="swatch"
                        style="background-color: {colors(d.id ?? d.label)}"
                    ></span>
                    {d.label} <em>({d.value})</em>
                </li>
            {/each}
        </ul>
    </div>
</main>

<style>
    main {
        display: flex;
        justify-content: center; /* Center the container horizontally */
    }

    .container {
        display: flex;
        align-items: center; /* Center items vertically */
        gap: 20px; /* Add space between the circle and the legend */
    }

    svg {
        max-width: 20em;
        margin-block: 2em;
        /* Do not clip shapes outside the viewBox */
        overflow: visible;
    }

    svg:has(path:hover) path:not(:hover) {
        opacity: 0.5;
    }

    /* Add transition effect */
    path {
        transition-property: transform, opacity, fill;
        transition: opacity 0.3s ease; /* Adjust timing and easing as needed */
        /* Calculate angle and midpoint angle */
        --angle: calc(var(--end-angle) - var(--start-angle));
        --mid-angle: calc(var(--start-angle) + var(--angle) / 2);
    }

    path:focus {
        outline: none;
    }

    .legend {
        list-style: none;
        padding: 1em;
        margin: 0;
        border: 1px solid #ccc;
        border-radius: 5px;
        flex: 1; /* Occupy all available width */
        display: flex;
        flex-wrap: wrap; /* Enable wrapping of items */
        justify-content: space-evenly; /* Distribute items evenly */
        flex-direction: row; /* Set initial direction to row */
    }

    .legend li {
        display: flex;
        align-items: center;
        gap: 0.5em;
        margin-bottom: 0.5em;
    }

    .swatch {
        width: 1em;
        height: 1em;
        border-radius: 50%;
        display: inline-block;
    }

    /* Pie.svelte CSS */

    .selected {
        --color: oklch(60% 45% 0) !important; /* Choose your desired color */

        /* Apply color to the selected wedge */
        &:is(path) {
            fill: var(--color);
        }

        transform: rotate(var(--mid-angle)) translateY(-6px) scale(1.1)
            rotate(calc(-1 * var(--mid-angle)));
    }

    /* Apply cursor pointer to make wedges clickable */
    path {
        cursor: pointer;
    }

    svg:has(path:hover, path:focus-visible) {
        path:not(:hover, :focus-visible) {
            opacity: 50%;
        }
    }
</style>
