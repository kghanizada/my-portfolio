<svelte:head>
<title>Meta</title>
</svelte:head>

<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import Pie from "$lib/Pie.svelte";

    let data = [];
    let commits = [];

    $: fileLengths = d3.rollups(data, v => d3.max(v, v => v.line), d => d.file);
    $: averageFileLength = d3.mean(fileLengths, d => d[1]);
    $: workByPeriod = d3.rollups(data, v => v.length, d => d.datetime.toLocaleString("en", {dayPeriod: "short"}))
    $: maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    const numberOfFiles = d3.group(data, d => d.file).size;


    // Define the width and height for the SVG canvas
    let width = 1000, height = 600;

   // Initialize scales; these will be set after data is loaded
    let xScale, yScale;
    let margin = {top: 10, right: 10, bottom: 30, left: 20};
    let usableArea = {
	top: margin.top,
	right: width - margin.right,
	bottom: height - margin.bottom,
	left: margin.left
    };
    usableArea.width = usableArea.right - usableArea.left;
    usableArea.height = usableArea.bottom - usableArea.top;
    let xAxis, yAxis;

    // Function to set up axis
    $: if (xScale && yAxis) {
    d3.select(xAxis).call(d3.axisBottom(xScale));
    }

    $: if (yScale && yAxis) {
    d3.select(yAxis).call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, "0") + ":00"));
    }

    let yAxisGridlines;

    // Function to set up grid lines

    $: if (yScale && yAxis) {
     d3.select(yAxis).call(d3.axisLeft(yScale));

    // Set up yAxisGridlines
      yAxisGridlines = d3.axisLeft(yScale)
         .tickFormat("")
         .tickSize(-usableArea.width); // Extend tick lines across the chart

    // Apply the grid lines to the SVG
     if (yAxisGridlines) {
       d3.select('.gridlines')
            .call(yAxisGridlines);
     }
}

// Variables for mouse interaction

let hoveredIndex = -1;
$: hoveredCommit = commits[hoveredIndex] ?? {};
let cursor = {x: 0, y: 0};


 // Function to handle mouse enter event
function handleMouseEnter(event, index) {
    cursor = { x: event.clientX, y: event.clientY };
    hoveredIndex = index;

    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${cursor.x + 15}px`; // Offset by 15px to not overlap the cursor
    tooltip.style.top = `${cursor.y + 15}px`; // Offset by 15px to not overlap the cursor
    tooltip.hidden = false; // Make the tooltip visible
}

// Function to handle mouse leave event
function handleMouseLeave() {
    hoveredIndex = -1;
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = true; // Hide the tooltip
}

    onMount(async () => {
        // Fetch and parse the CSV file
        data = await d3.csv("loc.csv", row => ({
            ...row,
            line: Number(row.line),
            depth: Number(row.depth),
            length: Number(row.length),
            date: new Date(row.date + "T00:00" + row.timezone),
            datetime: new Date(row.datetime)
        }));

        // Group the data by the commit property and transform into commits array
        commits = d3.groups(data, d => d.commit).map(([commit, lines]) => {
            let first = lines[0];
            let {author, date, time, timezone, datetime} = first;
            let ret = {
                id: commit,
                url: "https://github.com/your-username/your-repo/commit/" + commit,
                author, date, time, timezone, datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length
            };

            // Like ret.lines = lines
            // but non-enumerable so it doesn’t show up in JSON.stringify
            Object.defineProperty(ret, "lines", {
                value: lines,
                configurable: true,
                writable: true,
                enumerable: false,
            });

            return ret;

        });

        // Create the X scale
    xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime)) // Get the extent of dates
      .range([margin.left, width - margin.right]) // Set the range from 0 to the width of the SVG
      .nice(); // This makes the scale end on round values

    // Create the Y scale
    yScale = d3.scaleLinear()
      .domain([0, 24]) // Assume hourFrac ranges from 0 to 24
      .range([height - margin.bottom, margin.top]) // SVG Y-axis goes from bottom to top
      .nice(); // This makes the scale end on round values
    });


    let svg; // Define svg variable to hold reference to the svg element
    let brushSelection = null;
    let selectedLines = [];
    let languageBreakdown = [];
    let selectedCommitIds = new Set(); 

 // Call d3.brush() on the svg element inside a reactive block
 $: {
    if (svg) {
        d3.select(svg).call(d3.brush().on("start brush end", brushed));
        // Move the dots and everything after the overlay to the end of their parent
        d3.select(svg).selectAll(".dots, .overlay ~ *").raise();
    }
}


function brushed (evt) {
    brushSelection = evt.selection;
	// Trigger Svelte's reactivity to update any dependent elements
    // For example, updating the selection display or filtering data based on the selection
    if (brushSelection) {
        console.log("Current brush selection:", brushSelection);
        // Add any additional logic needed when the selection changes
        // For example, filtering the commits to those within the selection
        updateSelectedCommits();
    } else {
        // Handle the case where the selection is cleared
        console.log("Brush selection cleared");
    }
}



function isCommitSelected (commit) {
	if (!brushSelection) {
		return false;
	}
	// Extract the top-left ([0]) and bottom-right ([1]) corners of the selection
    const [[x0, y0], [x1, y1]] = brushSelection;

    // Map the commit's datetime and hourFrac to pixel coordinates
    const commitX = xScale(commit.datetime);
    const commitY = yScale(commit.hourFrac);

    // Check if the commit's coordinates are within the brush selection bounds
    return x0 <= commitX && commitX <= x1 && y0 <= commitY && commitY <= y1;
}


$: selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
$: hasSelection = brushSelection && selectedCommits.length > 0;
$: selectedLines = (hasSelection ? selectedCommits : commits).flatMap(d => d.lines);


$: languageBreakdown = d3.rollups(
    selectedLines,
    v => v.length, // The reducer function to count lines
    d => d.language // The key to group by, which is the language of each line
);

//step 5.6
$: pieChartData = languageBreakdown.map(([language, lines]) => ({
    label: language,
    value: lines
}));


</script>


<h2>Summary</h2>

<dl class="stats">
    <dt>Total <abbr title="Lines of code">LOC</abbr></dt>
    <dd>{data.length}</dd>

    <dt>Average File Length</dt>
    <dd>{averageFileLength}</dd>

    <dt>Number of Files</dt>
    <dd>{numberOfFiles}</dd>

    <dt>Maximum Period</dt>
    <dd>{maxPeriod}</dd>

</dl>


<dl id="commit-tooltip" class="info tooltip {hoveredIndex > -1 ? 'hovered' : ''}">
	<dt>Commit</dt>
	<dd><a href="{ hoveredCommit.url }" target="_blank">{ hoveredCommit.id }</a></dd>

	<dt>Date</dt>
	<dd>{ hoveredCommit.datetime?.toLocaleString("en", {date: "full"}) }</dd>

    <dt>Time</dt>
    <dd>{ hoveredCommit.time }</dd> 

    <dt>Author</dt>
    <dd>{ hoveredCommit.author }</dd> 

</dl>





<svg viewBox="0 0 {width} {height}" bind:this={svg}>
    <g class="gridlines" transform="translate({usableArea.left}, 0)" />
    <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
    <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />

  <g class="dots">
    {#each commits as commit, index}
      <circle
        cx={xScale(commit.datetime)}
        cy={yScale(commit.hourFrac)}
        r="5"
        fill="steelblue"
        on:mouseenter={event => handleMouseEnter(event, index)}
        on:mouseleave={handleMouseLeave}
      />
    {/each}
  </g>
</svg>


<p>{hasSelection ? selectedCommits.length : "No"} commits selected</p>


{#if languageBreakdown.length > 0}
    <h3>Language Breakdown</h3>
    <ul>
        {#each languageBreakdown as [language, lines]}
            <li>
                {language}: {formatPercent(lines / totalSelectedLines)}
            </li>
        {/each}
    </ul>
{/if}


{#if pieChartData && pieChartData.length > 0}
    <Pie {pieChartData} />
{/if}


<style>
.stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    list-style: none;
    padding: 0;
}

.stats dt {
    font-weight: bold;
    margin-right: 10px;
}

.stats dd {
    margin: 0;
    margin-right: 20px;
}

svg {
        overflow: visible;
    }

.gridlines {
	stroke-opacity: .2;
}

.circle {
	transition: 200ms;
    transform-origin: center;
    transform-box: fill-box;
}

.circle:hover {
    transform: scale(1.5);
}

.tooltip {
    background-color: white; /* Solid white, or use rgba for semi-transparency */
    border-radius: 6px; /* Rounded corners */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Shadow for depth */
    padding: 10px; /* Padding inside the tooltip */
    position: absolute; /* Positioned absolutely within the relative container */
    pointer-events: none; /* Ignore mouse events */
    z-index: 100; /* Ensure it's above other elements */
    display: none; /* Start hidden */
    opacity: 0; /* Start transparent */
    visibility: hidden; /* Start invisible */
    transition: opacity 0.2s, visibility 0.2s; /* Smooth transitions for opacity and visibility */
}

/* This class will be toggled based on whether a dot is hovered */
.hovered {
    display: block;
    opacity: 1;
    visibility: visible;
}


dl.info {
	/* ... other styles ... */
	transition-duration: 500ms;
	transition-property: opacity, visibility;

	&[hidden]:not(:hover, :focus-within) {
		opacity: 0;
		visibility: hidden;
	}
}

@keyframes marching-ants {
        to {
            stroke-dashoffset: -8; /* 5 + 3 */
        }
    }

    svg :global(.selection) {
        fill-opacity: 10%;
        stroke: black;
        stroke-opacity: 70%;
        stroke-dasharray: 5 3;
        animation: marching-ants 2s linear infinite;
    }

    .selected-dot {
    fill: red; /* Change the fill color to visually indicate selection */
    }
</style>