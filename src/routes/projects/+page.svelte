<svelte:head>
	<title>My Projects</title>
</svelte:head>

<script>
    import Pie from '$lib/Pie.svelte'; 
    import projects from '$lib/projects.json';
    import Project from '$lib/Project.svelte';
    
</script>

<main>
    <h1>My Projects ({ projects.length })</h1>
    <Pie data={projects}/>
    <div class="projects">
            {#each projects as p}
            <Project info={p} year={p.year} />
            {/each}
        </div>

       
</main>
<style>
    /* Add any necessary styles here */
</style>