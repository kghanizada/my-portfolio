console.log("IT’S ALIVE!");

function $$ (selector, context = document) {
	return Array.from(context.querySelectorAll(selector));
}


//let pages = [
   // {url: ".", title: "Home"}, // Adjusted homepage URL
  //  {url: "projects", title: "Projects"}, // Removed .html extension
  //  {url: "resume", title: "Resume"}, // Removed .html extension
  //  {url: "contact", title: "Contact"} // Removed .html extension
    // add the rest of your pages here
//];


const ARE_WE_HOME = document.documentElement.classList.contains("home");

let nav = document.createElement("nav");

document.body.prepend(nav);


for (let p of pages) {
	let url = p.url;
	let title = p.title;
	// TODO create link and add it to nav
	
    //url = !ARE_WE_HOME && !url.startsWith("http") ? "../" + url : url;

	let a = document.createElement("a");
	a.href = url;
	a.textContent = title;

	a.classList.toggle("current", a.host === location.host && a.pathname === location.pathname);

	if (a.host === location.host && a.pathname === location.pathname) {
		a.classList.add("current");
	}
    nav.append(a);

}

document.body.insertAdjacentHTML("afterbegin", `
   <label class="color-scheme">
      Theme:
      <select id="colorSchemeSelector">
         <option value="auto">Automatic</option>
         <option value="light">Light</option>
         <option value="dark">Dark</option>
      </select>
   </label>`
);

const colorSchemeSelector = document.getElementById("colorSchemeSelector");

colorSchemeSelector.addEventListener("input", function (event) {
    console.log("color scheme changed to", event.target.value);
    document.documentElement.style.setProperty("color-scheme", event.target.value);

	// Save the user's preference to localStorage
	  localStorage.setItem("colorScheme", event.target.value);
	
});

// Set initial value based on user's preference stored in localStorage
const storedColorScheme = localStorage.getItem("colorScheme");
if (storedColorScheme) {
    colorSchemeSelector.value = storedColorScheme;
} else {
    // If no preference is stored, set based on user's system preference
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    colorSchemeSelector.value = prefersDarkMode ? "dark" : "light";
}

// Trigger input event manually to update color scheme initially
colorSchemeSelector.dispatchEvent(new Event("input"));

// Add event listener to handle changes
colorSchemeSelector.addEventListener("change", () => {
    const selectedValue = colorSchemeSelector.value;
    document.documentElement.setAttribute("data-color-scheme", selectedValue);
});



