<script>
    // Add any JavaScript logic or data fetching here
    import projects from '$lib/projects.json';
    import Project from "$lib/Project.svelte";
    let profileData = {
	ok: true,
	json: async () => ({
		followers: 100,
		following: 100,
		public_repos: 100,
		public_gists: 100,
	})
};
    
    //fetch("https://api.github.com/users/your-username");


</script>


<style>

    /* Add CSS styles specific to this page */
    .fit-picture {
        max-width: 100%;
        height: auto;
    }

/* My github stats */
    .profile-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
}

.profile-stats div {
    grid-row: span 2;
}

.profile-stats dt {
    grid-row: 1;
}

.profile-stats dd {
    grid-row: 2;
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

<section>
    <h2>Github Profile Stats</h2>
    {#await fetch("https://api.github.com/users/kghanizada")}
        <p>Loading...</p>
    {:then response}
        {#await response.json()}
            <p>Decoding...</p>
        {:then data}
            <dl>
                <div>
                    <dt>Followers:</dt>
                    <dd>{data.followers}</dd>
                </div>
                <div>
                    <dt>Following:</dt>
                    <dd>{data.following}</dd>
                </div>
                <div>
                    <dt>Public Repos:</dt>
                    <dd>{data.public_repos}</dd>
                </div>
                <div>
                    <dt>Public Gists:</dt>
                    <dd>{data.public_gists}</dd>
                </div>
            </dl>
        {:catch error}
            <p class="error">Something went wrong: {error.message}</p>
        {/await}
    {:catch error}
        <p class="error">Something went wrong: {error.message}</p>
    {/await}
</section>


<h2>Latest Projects</h2>

<div class="projects">
    {#each projects.slice(0, 2) as project}
		<Project info={project} hLevel= 3 />
    {/each}
</div>



