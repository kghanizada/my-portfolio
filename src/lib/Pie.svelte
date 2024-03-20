<script>
    import * as d3 from 'd3';
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    
    export let data = [];
    export let selectedIndex = -1;

    

let sliceGenerator = d3.pie().value(d => d.value);

// Declare variables
   let arcData = [];
  let arcs = [];
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Use a reactive statement to recalculate arcData and arcs when data changes
  $: {
    arcData = d3.pie().value(d => d.value)(data);
    arcs = arcData.map(d => arcGenerator(d));
  }


  function toggleWedge(index, event) {
        // Check if the event is triggered by Enter key or if event.key doesn't exist (for mouse click)
        if (!event.key || event.key === "Enter") {
            selectedIndex = selectedIndex === index ? -1 : index;
        }
    }

</script>

<main>
    <div class="container">
        <svg viewBox="-50 -50 100 100">
            {#each arcs as arc, index}
             <path 
                    d={arc} 
                    fill={colors(index)}
                    class:selected={selectedIndex === index}
                    style="
                        --start-angle: { arc.startAngle }rad;
                        --end-angle: { arc.endAngle }rad;"
                    tabindex="0"
                    role="button"
                    aria-label={`Select ${data[index].label}`}
                    on:click={e => toggleWedge(index, e)}
                    on:keyup={e => toggleWedge(index, e)}
                />
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

    svg:has(path:hover) path:not(:hover) {
    opacity: 0.5;
    }

    /* Add transition effect */
    path {
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

  transform: 
    rotate(var(--mid-angle)) translateY(-6px) scale(1.1) rotate(calc(-1 * var(--mid-angle)));
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