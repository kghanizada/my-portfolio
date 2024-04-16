<script>

    import * as d3 from "d3";
    import { onMount } from "svelte";
    import Pie from "$lib/Pie.svelte";

    let data = [];
    let commits = [];
    let width = 1000, height = 600;
    let margin = {top: 10, right: 10, bottom: 30, left: 20};
    let usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left
    };



    usableArea.width = usableArea.right - usableArea.left;
    usableArea.height = usableArea.bottom - usableArea.top;

    let hoveredIndex = -1;

    $: hoveredCommit = commits[hoveredIndex] ?? {};

    let cursor = {x: 0, y: 0};



    onMount(async () => {
        data = await d3.csv("loc.csv", row => ({
            ...row,
            line: Number(row.line),
            depth: Number(row.depth),
            length: Number(row.length),
            datetime: new Date(row.datetime),
            date: new Date(new Date(row.datetime).setHours(0,0,0,0)),

    }));

        commits = d3.groups(data, d => d.commit).map(([commit, lines]) => {

            let first = lines[0];
            let {author, date, time, timezone, datetime} = first;
            let ret = {
                id: commit,
                url: "https://github.com/vis-society/lab-7/commit/" + commit,
                author: author,
                date: date,
                time: time,
                timezone: timezone,
                datetime: datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length

            };

            
            Object.defineProperty(ret, "lines", {
                value: lines,
                configurable: true,
                writable: true,
                enumerable: false,

            });

            return ret;

        });

        commits = d3.sort(commits, d => -d.totalLines);

    });



    $: maxDepth = d3.max(data, d => d.depth)
    $: meanDepth = d3.mean(data, d => d.depth)
    $: meanLength = d3.max(data, d => d.length)
    $: nrOfFiles = d3.group(data, d => d.file).size
    $: fileLengths = d3.rollups(data, v => d3.max(v, v => v.line), d => d.file);
    $: averageFileLength = d3.mean(fileLengths, d => d[1]);
    $: workByPeriod = d3.rollups(data, v => v.length, d => d.datetime.toLocaleString("en", {dayPeriod: "short"}))
    $: maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    $: xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();



    $: yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);
    $: rScale = d3.scaleSqrt()
        .domain(d3.extent(commits, d => d.totalLines))
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
        d3.select(yAxis).call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, "0") + ":00"));
        d3.select(yAxisGridlines).call(d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width))
    }

    let brushSelection;

    function brushed (evt) {
        brushSelection = evt.selection
    }

    

    function isCommitSelected(commit) {
        if (!brushSelection) {
            return false;
        } else {
            // Assuming brushSelection[0] is the top-left corner and brushSelection[1] is the bottom-right corner
            let min = {x: brushSelection[0][0], y: brushSelection[0][1]};
            let max = {x: brushSelection[1][0], y: brushSelection[1][1]};

            // Scale commit properties to the same coordinate space
            let x = xScale(commit.datetime);
            let y = yScale(commit.hourFrac);

            // Check if commit is within the bounding box
            return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
        }

    }


    let selectedCommentIndex = -1;
    let selectedCommits, hasSelection, selectedLines, languageBreakdown, pieData;

    $: {
        selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
        hasSelection = brushSelection && selectedCommits.length > 0;
        selectedLines = (hasSelection ? selectedCommits : commits).flatMap(d => d.lines);
        languageBreakdown = d3.rollups(selectedLines, v => v.length, d => d.type);
        pieData = languageBreakdown.map(([language, count]) => {
            return { value: ((count / selectedLines.length) * 100).toFixed(1), label: language };
        });
        console.log(pieData)
    }

</script>



<svelte:head>
    <title>Meta</title>
</svelte:head>



<h1>Meta</h1>

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



<svg viewBox="0 0 {width} {height}" bind:this={svg}>
    <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
    <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />
    <g class="gridlines" transform="translate({usableArea.left}, 0)" bind:this={yAxisGridlines} />
    <g class="dots">
        {#each commits as commit, index }
            <circle
                on:mouseenter={evt => {
                    hoveredIndex = index;
                    cursor = {x: evt.x, y: evt.y};
                }}

                on:mouseleave={evt => hoveredIndex = -1}
                cx={ xScale(commit.datetime) }
                cy={ yScale(commit.hourFrac) }
                r={ rScale(commit.totalLines) }
                class:circle-selected={isCommitSelected(commit)}
                class:circle-default={!isCommitSelected(commit)}
            />
        {/each}
    </g>

</svg>



<dl class="info tooltip" hidden={hoveredIndex === -1} style="top: {cursor.y}px; left: {cursor.x}px">
    <dt>Commit</dt>
    <dd><a href="{ hoveredCommit.url }" target="_blank">{ hoveredCommit.id }</a></dd>

    <dt>Author</dt>
    <dd>{ hoveredCommit.author }</dd>


    <dt>Date</dt>
    <dd>{ hoveredCommit.date?.toLocaleDateString("en", {date: "full"}) }</dd>


    <dt>Time</dt>
    <dd>{ hoveredCommit.time?.toLocaleString("en", {time: "full"}) }</dd>


    <dt>Lines</dt>
    <dd>{ hoveredCommit.lines?.length }</dd>

</dl>



<p>{hasSelection ? selectedCommits.length : "No"} commits selected</p>

<Pie data={pieData} bind:selectedIndex={selectedCommentIndex} />


<style>
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


    .stats dt, .stats dd {
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
        stroke-opacity: .2;
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

    dl.info dt, dl.info dd {
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
        transition: 200ms;
        fill-opacity: 0.3;
        fill:darkred ;
        &:hover {
            transform: scale(2.5);
            transform-origin: center;
            transform-box: fill-box;
        }
    }

    .circle-selected {
        fill: steelblue; /* Change this color as needed */
        transition: fill 200ms;
    }

</style>
