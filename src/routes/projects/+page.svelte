<svelte:head>
	<title>My Projects</title>
</svelte:head>

<script>
    import projects from '$lib/projects.json';
</script>

<main>
    <h1>My Projects ({ projects.length })</h1>
    <div class="projects">
            {#each projects as p}
                <article>
                    <a href={p.url}>
                    <h2>{p.title}</h2>
                    <img class="fit-picture" src={p.image} alt="">
                    <p>{p.description}</p>
                </article>
            {/each}
        </div>
</main>
<style>
    /* Add any necessary styles here */
</style>