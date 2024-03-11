
<script>
  import Header from './Header.svelte';
  import './styles.css';
  import { page } from '$app/stores';
 
 
  let pages = [
  {url: "./", title: "Home"},
  {url: "./projects", title: "Projects"},
  {url: "./resume", title: "Resume"},
  {url: "./contact", title: "Contact"}
 ];
 
 let root = globalThis?.document?.documentElement;
 $: root?.style.setProperty("color-scheme", colorScheme);


 let colorScheme = "light dark";
 
 // Step 1.4: Reading the color scheme from local storage
 let localStorage = globalThis.localStorage ?? {};
 colorScheme = localStorage.colorScheme ?? "light dark";
 
 // Step 1.5: Saving the color scheme to local storage
 $: {
        // Update local storage with the current color scheme
        localStorage.colorScheme = colorScheme;
    }
 </script>
 
 <label class="color-scheme">
  Theme:
  <select bind:value={colorScheme}>
      <option value="auto">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
  </select>
 </label>
 
 
 <nav>
  {#each pages as p }
    <a href={ p.url } class:current={"." + $page.route.id === p.url} target={p.url.startsWith("http") || p.url.startsWith("https") ? "_blank" : null}>{ p.title }</a>
  {/each}
  </nav>
 
 
  <div class="app">
  <Header />
 
  <main>
    <slot />
  </main>
 </div>
 
 
 
 <style>
 
 /*navgiation bar*/
 
 nav  {
  --border-color: oklch(50% 10% 200 / 40%);
  padding: 0;
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-bottom-color: var(--border-color);
  /*border-bottom-color: oklch(80% 3% 200);*/
 
 }
 
 nav ol {
  list-style-type: none;
  margin: 0;
  padding: 0;
  display: contents;
 }
 
 nav a {
  display: inline-block;
  flex: 1;
  color: inherit;
  text-align: center;
  padding: 0.5em;
  text-decoration: none;
 }
 
 nav a:hover {
  border-bottom-width: 0.4em;
  border-bottom-style: solid;
  border-bottom-color: var(--color-accent);
  background-color: color-mix(in oklch, var(--color-accent), canvas 85%);
  padding-bottom: 0.2em;
  color: inherit; /* Ensure the color of the link is inherited */
 }
 
 /* Adjust the background color based on the theme */
 [data-color-scheme="dark"] nav a:hover {
  background-color: var(--color-hover-dark);
 }
 
 [data-color-scheme="light"] nav a:hover {
  background-color: var(--color-hover-light);
 }
 
 nav a.current {
  border-bottom-width: 0.4em;
  border-bottom-style: solid;
  padding-bottom: 0.2em;
  border-bottom-color: var(--border-color);
  /*border-bottom-color: oklch(80% 3% 200);*/
  width: 150%;
  color: inherit; /* Ensure the color of the current link is inherited */
 }
 
 :root {
  --color-accent: #FFA500;
  --light-accent: hsl(39, 100%, 80%);
  --color-scheme: light;
  --color-hover-dark: rgba(255, 165, 0, 0.2); /* Adjust the hover background color for dark theme */
  --color-hover-light: rgba(255, 165, 0, 0.5); /* Adjust the hover background color for light theme */
 }
 
 
 /*themeswticher*/
 
 html {
 color-scheme: light dark;
 background-color: canvas;
 color: canvastext;
 }
 
 
 @media (prefers-color-scheme: dark) {
 nav li a {
   color: inherit; /* Use inherited color */
 }
 }
 
 [data-color-scheme="dark"] {
 color-scheme: dark;
 }
 
 
 [data-color-scheme="light"] {
 color-scheme: light;
 }
 
 
 .color-scheme {
 position: absolute;
 top: 1rem;
 right: 1rem;
 font-size: 80%;
 font-family: inherit;
 }
 
 
 
 </style>
 
 
 
 
 
 
 