<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import Pie from "$lib/Pie.svelte";
    import { computePosition, autoPlacement, offset } from "@floating-ui/dom";
    import FileLines from "./FileLines.svelte";
    import { flip } from "svelte/animate";
    import Scrolly from "svelte-scrolly";

    let myProgressVariable = 0; // Initialize the variable

    let data = [];
    let commits = [];
    let width = 1000,
        height = 600;
    let margin = { top: 10, right: 10, bottom: 30, left: 20 };
    let usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
    };

    let commitProgress = 100;
    let filteredCommits = [];
    let filteredLines = [];
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    usableArea.width = usableArea.right - usableArea.left;
    usableArea.height = usableArea.bottom - usableArea.top;

    let hoveredIndex = -1;

    $: hoveredCommit = filteredCommits[hoveredIndex] ?? {};

    onMount(async () => {
        data = await d3.csv("loc.csv", (row) => ({
            ...row,
            line: Number(row.line),
            depth: Number(row.depth),
            length: Number(row.length),
            datetime: new Date(row.datetime),
            date: new Date(new Date(row.datetime).setHours(0, 0, 0, 0)),
        }));

        commits = d3
            .groups(data, (d) => d.commit)
            .map(([commit, lines]) => {
                let first = lines[0];
                let { author, date, time, timezone, datetime } = first;
                let ret = {
                    id: commit,
                    url:
                        "https://github.com/vis-society/lab-7/commit/" + commit,
                    author: author,
                    date: date,
                    time: time,
                    timezone: timezone,
                    datetime: datetime,
                    hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                    totalLines: lines.length,
                };

                Object.defineProperty(ret, "lines", {
                    value: lines,
                    configurable: true,
                    writable: true,
                    enumerable: false,
                });

                return ret;
            });

        commits = d3.sort(commits, (d) => -d.totalLines);
    });

    $: maxDepth = d3.max(data, (d) => d.depth);
    $: meanDepth = d3.mean(data, (d) => d.depth);
    $: meanLength = d3.max(data, (d) => d.length);
    $: nrOfFiles = d3.group(data, (d) => d.file).size;
    $: fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file,
    );
    $: averageFileLength = d3.mean(fileLengths, (d) => d[1]);
    $: workByPeriod = d3.rollups(
        data,
        (v) => v.length,
        (d) => d.datetime.toLocaleString("en", { dayPeriod: "short" }),
    );
    $: maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    $: xScale = d3
        .scaleTime()
        .domain(d3.extent(filteredLines, (d) => new Date(d.datetime)))
        .range([usableArea.left, usableArea.right])
        .nice();

    $: yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);
    $: rScale = d3
        .scaleSqrt()
        .domain(d3.extent(commits, (d) => d.totalLines))
        .range([2, 30])
        .nice();

    let svg;

    $: {
        d3.select(svg).call(d3.brush());
        d3.select(svg).selectAll(".dots, .overlay ~ *").raise();
        d3.select(svg).call(d3.brush().on("start brush end", brushed));
    }

    let xAxis, yAxis, yAxisGridlines;

    $: {
        d3.select(xAxis).call(d3.axisBottom(xScale));
        d3.select(yAxis).call(
            d3
                .axisLeft(yScale)
                .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00"),
        );
        d3.select(yAxisGridlines).call(
            d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width),
        );
    }

    let brushSelection;

    // Update the brushed() function to use filteredCommits and filteredLines
    function brushed(evt) {
        let brushSelection = evt.selection;
        selectedCommits = !brushSelection
            ? []
            : filteredCommits.filter((commit) => {
                  let min = {
                      x: brushSelection[0][0],
                      y: brushSelection[0][1],
                  };
                  let max = {
                      x: brushSelection[1][0],
                      y: brushSelection[1][1],
                  };
                  let x = xScale(commit.datetime);
                  let y = yScale(commit.hourFrac);

                  return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
              });
    }

    function isCommitSelected(commit) {
        return selectedCommits.includes(commit);
    }

    let selectedCommits = [];

    let selectedCommentIndex = -1;
    let hasSelection, selectedLines, languageBreakdown, pieData;

    $: {
        hasSelection = selectedCommits.length > 0;
        selectedLines = (
            hasSelection ? selectedCommits : filteredCommits
        ).flatMap((d) => d.lines);
        languageBreakdown = d3.rollups(
            selectedLines,
            (v) => v.length,
            (d) => d.type,
        );
        pieData = languageBreakdown.map(([language, count]) => {
            return {
                value: ((count / selectedLines.length) * 100).toFixed(1),
                label: language,
            };
        });
        console.log(pieData);
    }

    let commitTooltip;
    let tooltipPosition = { x: 0, y: 0 };

    async function dotInteraction(index, evt) {
        // code will go here
        if (
            evt.type === "mouseenter" ||
            evt.type === "focus" ||
            evt.type === "click" ||
            (evt.type === "keyup" && evt.key === "Enter")
        ) {
            //added these three to make the pie chart reactive when hovered over the dots
            hoveredIndex = index;
            let selectedCommit = commits[index];
            selectedCommits = [selectedCommit];
            // dot hovered
            let hoveredDot = evt.target;
            tooltipPosition = await computePosition(hoveredDot, commitTooltip, {
                strategy: "fixed", // because we use position: fixed
                middleware: [
                    offset(5), // spacing from tooltip to dot
                    autoPlacement(), // see https://floating-ui.com/docs/autoplacement
                ],
            });
        } else if (evt.type === "mouseleave" || evt.type === "blur") {
            // dot unhovered
            hoveredIndex = -1;
            //added these three to make the pie chart reactive when hovered over the dots
            selectedCommits = [];
        }
    }

    $: timeScale = d3.scaleTime(
        d3.extent(commits, (d) => d.datetime),
        [0, 100],
    );

    $: commitMaxTime = timeScale.invert(commitProgress);

    $: console.log("current progress", commitProgress);
    $: console.log("current progress", commitMaxTime);

    // Add reactivity declaration for filteredCommits and filteredLines
    $: filteredCommits = commits.filter(
        (commit) => commit.datetime <= commitMaxTime,
    );
    $: filteredLines = data.filter(
        (line) => new Date(line.datetime) <= commitMaxTime,
    );
</script>

<svelte:head>
    <title>Meta</title>
</svelte:head>

<h1>Meta</h1>

<p>This page includes stats about the code of this website.</p>

<dl class="stats">
    <dt>Total <abbr title="Lines of code">LOC</abbr></dt>
    <dd>{data.length}</dd>

    <dt>Max Depth</dt>
    <dd>{maxDepth}</dd>

    <dt>Number of Files</dt>
    <dd>{nrOfFiles}</dd>

    <dt>Average File Length</dt>
    <dd>{averageFileLength?.toFixed(1)}</dd>

    <dt>Maximum Period</dt>
    <dd>{maxPeriod}</dd>
</dl>


<label class="filter-label">
    Show commits until:
    <input
        type="range"
        min="0"
        max="100"
        bind:value={commitProgress}
        style="width: 100%;"
    />
    <time>{commitMaxTime.toLocaleString()}</time>
</label>


<dl
    class="info tooltip"
    bind:this={commitTooltip}
    hidden={hoveredIndex === -1}
    style="top: {tooltipPosition.y}px; left: {tooltipPosition.x}px"
>
    <dt>Commit</dt>
    <dd><a href={hoveredCommit.url} target="_blank">{hoveredCommit.id}</a></dd>

    <dt>Author</dt>
    <dd>{hoveredCommit.author}</dd>

    <dt>Date</dt>
    <dd>{hoveredCommit.date?.toLocaleDateString("en", { date: "full" })}</dd>

    <dt>Time</dt>
    <dd>{hoveredCommit.time?.toLocaleString("en", { time: "full" })}</dd>

    <dt>Lines</dt>
    <dd>{hoveredCommit.lines?.length}</dd>
</dl>

<p>{hasSelection ? selectedCommits.length : "No"} commits selected</p>

<Scrolly bind:progress={commitProgress}> 
	<!-- Story here -->
        <p>
            In the realm of software development, each line of code tells a story—a tale of creativity, problem-solving, and collaboration. 
            As the codebase evolves, so does the narrative it weaves. Let's embark on a journey through time and code, exploring the rich 
            tapestry of commits and contributions that shape our digital landscape. </p>
        <p> At the heart of our narrative lie two powerful visualizations: a scatterplot and a pie chart, each offering a unique perspective 
            on the inner workings of our website's codebase. The scatterplot paints a picture of time and activity, plotting each commit as a 
            point in space, while the pie chart slices through the data, revealing the distribution of changes across different files. </p>
        <p> Imagine the scene: it's a crisp morning, the sun just peeking over the horizon, as the first lines of code come to life. With each
            keystroke, a commitment is made—to innovation, to progress, to excellence. "My first commit," you proclaim proudly, laying the 
            foundation for what is to come.</p>
        <p> As the days turn into weeks, and the weeks into months, the codebase grows, a testament to your dedication and expertise. With 
            each passing commit, you delve deeper into the intricacies of the project, leaving your mark on every line you touch.</p>
        <p> But it's not just about quantity—it's about quality. Each commit represents a step forward, a refinement of ideas, a strengthening 
            of the codebase. You pour over your work, ensuring that every line is crafted with care, every function optimized for efficiency.</p>
        <p> And so the story unfolds, a symphony of code and creativity, with each commit adding another chapter to the tale. From the humble
            beginnings of "my first commit" to the culmination of your efforts, you look back with pride on all that you've accomplished. </p>
        <p> But the journey doesn't end here—it's just the beginning. As you continue to code, to innovate, to push the boundaries of what's 
            possible, the story continues to evolve, with each commit paving the way for the future.</p>
        <p> So let us raise our virtual glasses to the commits that have come before, and to those that are yet to come. For in the world of
            software development, the story never truly ends—it simply grows with each line of code, each commit, each contribution.</p>

	<svelte:fragment slot="viz">
		<!-- Visualizations here -->

<svg viewBox="0 0 {width} {height}" bind:this={svg}>
    <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
    <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />
    <g
        class="gridlines"
        transform="translate({usableArea.left}, 0)"
        bind:this={yAxisGridlines}
    />
    <g class="dots">
        {#each commits as commit, index (commit.id)}
            <circle
                on:mouseenter={(evt) => dotInteraction(index, evt)}
                on:mouseleave={(evt) => dotInteraction(index, evt)}
                on:focus={(evt) => dotInteraction(index, evt)}
                on:blur={(evt) => dotInteraction(index, evt)}
                on:click={(evt) => dotInteraction(index, evt)}
                on:keyup={(evt) => {
                    if (evt.key === "Enter") {
                        dotInteraction(index, evt);
                    }
                }}
                tabindex="0"
                aria-describedby="commit-tooltip"
                aria-haspopup="true"
                cx={xScale(commit.datetime)}
                cy={yScale(commit.hourFrac)}
                r={rScale(commit.totalLines)}
                class:circle-selected={isCommitSelected(commit)}
                class:circle-default={!isCommitSelected(commit)}
                key={commit.id}
                animate:flip
            />
        {/each}
    </g>
</svg>

<Pie data={pieData} bind:selectedIndex={selectedCommentIndex} {colors} />


	</svelte:fragment>
</Scrolly>


<Scrolly 
    bind:progress={commitProgress} 
    throttle={100} 
    debounce={100}
    --scrolly-layout="viz-first" 
    --scrolly-viz-width="1.5fr"
     > 
	<!-- Story here -->
        <p>
        In the realm of software development, every line of code is a brushstroke, painting a picture of functionality, elegance, 
        and efficiency. Let us delve into the heart of our codebase, where the FileLines component reigns supreme, revealing the 
        intricate patterns and structures that define our project's essence. </p>
        <p>
        As the journey unfolds, we find ourselves immersed in a world of code, where each commit represents a step forward in 
        our quest for perfection. With every keystroke, we shape the destiny of our project, leaving behind a trail of edits and 
        revisions that tell the story of our progress.</p>
        <p>
        Picture this: a quiet evening, the soft glow of the monitor casting shadows across the room, as I embark on my coding journey.
        With determination in my heart and a vision in my mind, I make my first commit—a humble yet glorious declaration of intent.</p>
        <p>
        As time passes, the FileLines component becomes my canvas, each line of code a stroke of inspiration. With each commit, I weave a 
        tapestry of functionality, refining, optimizing, and perfecting the intricate web of logic that powers our project.</p>
        <p>
        But it's not just about the quantity of lines edited—it's about the impact they have on the grand design. With each edit, I scrutinize,
        analyze, and evaluate, ensuring that every line serves a purpose, every function contributes to the greater whole. </p>
        <p>
        And so the story unfolds, a symphony of code and creativity, with the FileLines component at its core. From the humble beginnings of
        my first commit to the culmination of my efforts, I look back with pride on the journey I've undertaken.</p>
        <p>
        But the journey doesn't end here—it's just the beginning. As I continue to code, to innovate, to push the boundaries of what's possible, 
        the FileLines component remains a constant companion, guiding me towards new heights of achievement.</p>
        <p>
        So let us raise our virtual glasses to the FileLines component—to the lines of code that define our project's essence, and to the journey 
        that lies ahead. For in the world of software development, every line counts, every commit matters, and every contribution shapes the future.</p>

	<svelte:fragment slot="viz">
		<!-- Visualizations here -->

    <FileLines lines={filteredLines} {colors} />
    
    </svelte:fragment>
</Scrolly>


<style>

    ::-webkit-scrollbar-thumb {
        background-color: #888;
    }
    
    ::-webkit-scrollbar-thumb:after {
        content: attr(data-date);
        color: white;
        font-size: 12px;
        position: absolute;
        top: 50%;
        left: 110%;
        transform: translateY(-50%);
        padding: 2px 6px;
        border-radius: 5px;
        background-color: rgba(0, 0, 0, 0.8);
    }

    :global(body) {
        max-width: min(120ch, 80vw);
    }

    .stats {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        list-style: none;
        margin: 20px auto; /* Centers the dl and adds some margin */
        padding: 20px; /* Padding inside the dl */
        border: 1px solid #ccc; /* Border around the dl */
        border-radius: 10px; /* Rounded corners for the dl */
        background-color: #f9f9f9; /* Light background for the dl */
    }

    .stats dt,
    .stats dd {
        margin: 0; /* Removes default margin */
    }

    .stats dt {
        grid-column: 1; /* Places all dt in the first column */
        font-weight: bold; /* Makes dt labels bold */
    }

    .stats dd {
        grid-column: 2; /* Places all dd in the second column */
        text-align: right; /* Aligns dd values to the right */
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

    svg {
        overflow: visible;
    }

    .gridlines {
        stroke-opacity: 0.2;
    }

    dl.info {
        display: grid;
        grid-template-columns: auto auto; /* Defines two columns */
        column-gap: 20px; /* Adjusts the space between the two columns */
        row-gap: 10px; /* Adjusts the space between each row */
        transition-duration: 500ms;
        transition-property: opacity, visibility;
        &[hidden]:not(:hover, :focus-within) {
            opacity: 0;
            visibility: hidden;
        }
    }

    dl.info dt,
    dl.info dd {
        margin: 0; /* Removes default margin for a cleaner look */
    }

    .tooltip {
        display: grid;
        position: fixed;
        top: 1em;
        left: 1em;
        background-color: oklch(40% 0.15 250 / 40%);
        box-shadow: gray;
        border-radius: 0.5em;
        backdrop-filter: blur();
        padding: 1em;
    }

    circle {
        transition: 0.1ms;
        fill-opacity: 0.3;
        fill: darkred;
        &:hover {
            transform: scale(2.5);
            transform-origin: center;
            transform-box: fill-box;
        }

        @starting-style {
            r: 0; /* Define the starting state for the radius */
        }
    }

    .circle-selected {
        fill: steelblue; /* Change this color as needed */
        transition: fill 200ms;
    }

    .filter-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px; /* Add some space below the slider container */
    }

    /* Slider styles */
    input[type="range"] {
        flex: 1; /* Make the slider fill the available space */
        height: 5px; /* Set the height of the slider */
        background-color: #ddd; /* Set the background color */
        border: none; /* Remove border */
        border-radius: 5px; /* Apply border radius */
        outline: none; /* Remove outline */
        margin-right: 10px; /* Add some space between slider and time element */
    }

    /* Time element styles */
    time {
        font-size: 14px; /* Adjust font size */
        color: #555; /* Set text color */
    }
</style>
