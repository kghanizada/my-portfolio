<script>
     export let info = {};
     let p = info;
</script> 


<article>
    <a href={p.url}>
    <h2>{p.title}</h2>
    <img class="fit-picture" src={p.image} alt="">
    <p>{p.description}</p>
</article>