<script>
    // Add any JavaScript logic or data fetching here
    import projects from '$lib/projects.json';
    import Project from "$lib/Project.svelte";
</script>


<style>
    /* Add CSS styles specific to this page */
    .fit-picture {
        max-width: 100%;
        height: auto;
    }

</style>

<h1>Khadija Ghanizada</h1>
<img
    class="fit-picture"
    src="images/Butterfly.jpg"
    alt="A beautiful monarch butterfly pollinating a flower at Bard College farm."
/>
<p>
    My name is Khadija Ghanizada. I am a graduate student at the Department of Urban Studies and Planning at MIT. Currently, I am taking 3 classes, working as a research assistant and teacher assistant.
</p>

<h2>Latest Projects</h2>

<div class="projects">
    {#each projects.slice(0, 2) as project}
		<Project info={project} hLevel=2/>
    {/each}
</div>
