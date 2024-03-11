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
