<svelte:head>
	<title>My Projects</title>
</svelte:head>

<script>
    import Pie from '$lib/Pie.svelte'; 
    import projects from '$lib/projects.json';
    import Project from '$lib/Project.svelte';
    import * as d3 from "d3";

    // Define search query variable
    let query = "";

    

    // Filter projects based on search query
    let filteredProjects;

    $: filteredProjects = projects.filter((project) => {
    if (query) {
    return project.title.toLowerCase().includes(query.toLowerCase());
    }
    return true;
    });

    $: filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join("\n").toLowerCase();
    return values.includes(query.toLowerCase());
    });

    let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year
    );


    let pieData = [];
    // Use a reactive block to recalculate pieData based on filteredProjects
    $: {
    // Reset pieData to an empty array
    pieData = [];

    // Calculate pieData based on filteredProjects
    filteredProjects.forEach(project => {
      const year = project.year;
      // Find if the year already exists in pieData
      const index = pieData.findIndex(item => item.label === year);
      if (index !== -1) {
        // Increment the count if the year exists
        pieData[index].value++;
      } else {
        // Add a new entry if the year doesn't exist
        pieData.push({ label: year, value: 1 });
      }
    });
  }

  let selectedYearIndex = -1;
  // Step 1: Define a reactive variable to hold the selected year
  let selectedYear;
   $: selectedYear = selectedYearIndex > -1 ? pieData[selectedYearIndex].label : null;


   // Step 4: Filter projects by the selected year
    let filteredByYear = [];
    $: filteredByYear = selectedYear ? projects.filter(project => project.year === selectedYear) : projects;

</script>

<main>

    <h1>My Projects ({ projects.length })</h1>
    <!-- Step 2: Bind selectedYearIndex to selectedIndex prop of Pie component -->
  <Pie data={pieData} bind:selectedIndex={selectedYearIndex} />

  <!-- Step 3: Print selected index for testing -->
  <p>Selected Year: {selectedYear}</p>

    <input
    type="search"
    bind:value="{query}"
    aria-label="Search projects"
    placeholder="🔍 Search projects…"
    class="search-bar"
  />
    <div class="projects">
        {#each filteredByYear as p}
            <Project info={p} year={p.year} />
         {/each}
        </div>

       
</main>


<style>
   .search-container {
    margin-bottom: 20px; /* Adjust the margin bottom as needed */
}

.search-bar {
    width: 1000px; /* Adjust the width as needed */
    height: 40px; /* Adjust the height as needed */
}

.projects {
    margin-top: 30px; /* Adjust the margin top as needed */
}
</style>