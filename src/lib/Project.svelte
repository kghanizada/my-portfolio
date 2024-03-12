<script>
     export let info = {};
     let p = info;
     export let hLevel = 3;
</script> 



<article>
    <a href={p.url}>
    <svelte:element this={"h" + hLevel}>{ p.title }</svelte:element>
    <img class="fit-picture" src={p.image} alt="">
    <p>{p.description}</p>
</article>

<style>

article {
  display: grid;
  grid-template-rows: subgrid;

}

article {
  grid-row: span 3; 
}


article {
  margin-bottom: 20px; /* Add margin at the bottom of each article */
  min-height: 80px; /* Set a minimum height for each article */
}

h2,h3 {
  margin: 0;
  margin-bottom: 20px; /* Add margin at the bottom of each article */
  min-height: 50px; /* Set a minimum height for each article */
}

a{
    text-decoration: none;
    color:orange
}

</style>