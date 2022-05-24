function ArticleInfoBox(article) {
	const root = createElement("div", null, "addon-root");
	root.setAttribute("id", "addon-root");
	
	const navigationBar = createElement("div", root, "addon-navigationBar");
	const contentEl = createElement("div", root, "addon-content");
	
	this.close = function() {
		BaseNavigationElement.close(contentEl);
	}
	
	const timeline = new Timeline(article, contentEl, navigationBar);
	const articleCategory = new ArticleCategory(article, contentEl, navigationBar);
	const automateBtn = new AutomateBtn(article, contentEl, navigationBar);
	
	
	//add navigationBar
	let oldNavigation = document.getElementById("addon-root");
	if(oldNavigation) {
		oldNavigation.parentNode.removeChild(oldNavigation);
	}
	const forumContainer = document.getElementById("forumcontainer").getElementsByClassName("forum")[0];
	forumContainer.insertBefore(root, document.getElementById("postings-container"));
}