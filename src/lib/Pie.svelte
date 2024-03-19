<script>
    import * as d3 from 'd3';
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

   
let data = [
    { value: 1, label: "apples" },
    { value: 2, label: "oranges" },
    { value: 3, label: "mangos" },
    { value: 4, label: "pears" },
    { value: 5, label: "limes" },
    { value: 5, label: "cherries" }
];

let sliceGenerator = d3.pie().value(d => d.value);
let arcData = sliceGenerator(data);
let arcs = arcData.map(d => arcGenerator(d));
let colors = d3.scaleOrdinal(d3.schemeTableau10);


</script>

<main>
    <div class="container">
        <svg viewBox="-50 -50 100 100">
            {#each arcs as arc, i}
                <path d={ arc } fill={ colors(i) } />
            {/each}
        </svg>
        <ul class="legend">
            {#each data as d, index}
                <li style="--color: { colors(index) }">
                    <span class="swatch" style="background-color: { colors(index) }"></span>
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
</style>