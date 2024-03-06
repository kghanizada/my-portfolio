<svelte:head>
	<title>Contact me</title>
</svelte:head>

<script>
    // You can add any JavaScript logic here if needed
  </script>
  
  <style>
    /* You can add your CSS styles here */
  </style>
  
  <main class="contact-page">
    <h1> Contact me </h1>
  
    <form class="form" action="mailto:kg7952@mit.edu" method="post" enctype="text/plain">
      <label for="name"> Name: </label>
      <input type="text" name="name" id="name" required />
  
      <label for="Subject"> Subject: </label>
      <input type="text" name="Subject" id="Subject" required />
    
      <label for="email"> Email: </label>
      <input type="email" name="email" id="email" required />
     
      <label for="body">Body:</label>
      <textarea id="body" name="body" rows="5" cols="33"></textarea>
  
      <input type="submit" value="Submit">
    </form>
  </main>