<script>
    import * as d3 from "d3";
    export let lines = []; // Input prop to receive lines data
    let files = [];
    let colors = d3.scaleOrdinal(d3.schemeTableau10);  // Create an ordinal scale for colors

    // Group lines by file and convert to {name, lines} objects
    $: {
        files = d3.groups(lines, d => d.file).map(([name, lines]) => {
        return { name, lines };
        });

        // Sort files by number of lines in descending order
        files = d3.sort(files, (a, b) => b.lines.length - a.lines.length);
    }
   
</script>

<!-- Display filenames and unit visualization -->
<dl class="files">
    {#each files as file (file.name) }
        <div class="file-entry">
            <dt><code>{file.name}</code> <small>({file.lines.length} lines)</small></dt>
            <dd>
                {#each file.lines as line (line.line) }
                    <div class="line" style="background-color: {colors(line.type)};" in:scale ></div>
                {/each}
            </dd>
        </div>
    {/each}
</dl>

<style>
/* Define grid layout for filenames and unit visualization */
dl.files {
    display: grid;
    gap: 10px;
}

/* Ensure proper alignment with Subgrid */
dl.files .file-entry {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center; /* Align items vertically */
    padding: 10px; /* Add padding for spacing */
    border: 1px solid; /* Add border for visual separation */
    border-radius: 5px; /* Add border radius for rounded corners */
}


/* Style filenames */
dl.files dt {
    margin: 0;
    padding: 5px; /* Add padding for better spacing */
    border-radius: 5px;
}

/* Style unit visualization dots */
.line {
    width: 8px; /* Adjust the size of the dots */
    height: 8px; /* Adjust the size of the dots */
    border-radius: 50%;
}

/* Ensure unit visualization dots wrap and are tightly packed */
dl.files dd {
    grid-column: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: left; /* Align items vertically */
    gap: 5px; /* Adjust the gap between dots */
    margin-left: 0;
}

/* Style the line count */
dl.files small {
    font-size: 0.8em; /* Small size */
    color: #666; /* Grey color */
}
</style>