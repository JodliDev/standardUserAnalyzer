'use strict';

function createElement(type, parentEl, className) {
	let el = document.createElement(type);
	if(className)
		el.className = className;
	if(parentEl)
		parentEl.appendChild(el);
	return el;
}
function close_on_clickOutside(el, additionalCloseFu) {
	if(el.hasOwnProperty("close-outside"))
		return
	el["close-outside"] = true;
	let closeFu = function() {
		if(!el)
			return false;
		delete el["close-outside"];
		document.removeEventListener("click", click_outside);

		el.parentElement.removeChild(el);
		
		if(additionalCloseFu)
			additionalCloseFu();
		el = null;
		return true;
	};
	let click_outside = function(e) {
		let target = e.target;

		if(el != null) {
			if(el.contains(target))
				return;

			closeFu();
		}
		else
			document.removeEventListener("click", click_outside);
		e.stopPropagation();
	};

	window.setTimeout(function() {//if a click event called this function, it is not done bubbling. So we have to stall this listener or it will be fired immediately
		document.addEventListener("click", click_outside);
	}, 200);
	return closeFu;
}
function createFloatingDropdown(referenceEl) {
	let parent = document.getElementById("story-community");
	let dropdownWidth = parent.offsetWidth/1.5;
	let rectParent = parent.getBoundingClientRect();
	let rectReference = referenceEl.getBoundingClientRect();
	
	let x = Math.min(parent.offsetWidth - dropdownWidth, Math.max(0, referenceEl.offsetLeft + referenceEl.offsetWidth/2 - dropdownWidth/2));
	let y = (rectReference.top - rectParent.top) + referenceEl.offsetHeight;
	
	let dropdownEl = createElement("div", null, "addon-dropdown");
	dropdownEl.style.cssText = "left:" + x + "px; top:" + y + "px; width: "+dropdownWidth+"px;";
	
	parent.appendChild(dropdownEl);
	referenceEl.classList.add("dropdown-opened");
	dropdownEl.close = close_on_clickOutside(dropdownEl, function() {
		referenceEl.classList.remove("dropdown-opened");
	});
	return dropdownEl;
}
function waitForElementChange(el) {
	return new Promise(function(resolve, reject) {
		const id = window.setTimeout(function() {
			reject("No change in 10 seconds");
			console.log(el)
			console.trace();
			observer.disconnect();
		}, 10000);
		const observer = new MutationObserver(function() {
			window.clearTimeout(id);
			observer.disconnect();
			resolve();
		});
		observer.observe(el, {childList: true});
	});
}
function fireEvent(el, event) {
	const e = event || new Event("click", {bubbles: true});
	el.dispatchEvent(e);
}

function jumpToPosting(postingId) {
	let id = "script"+Date.now();
	let script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("id", id);

	script.innerHTML = "window.ForumLoader.loadForum({forumKeyType: 1,forumKeyId: '"+getArticleId()+"', selectedPostingId: '"+postingId+"'});document.body.removeChild(document.getElementById('"+id+"'));";
	document.body.appendChild(script);
	document.getElementById("postings-container").waitingForReset = true;
	init();
}


async function drawCategoryChooser(isCategoryFu, addToCategoryFu) {
	let categories = await StoreDbFrontend.getAllCategories();
	let centerBox = createElement("div", null, "addon-center");
	let box = createElement("div", centerBox, "addon-centerContent addon-categoryChooser");
	
	const mainCategoryId = (await StoreDbFrontend.getMainCategory()).id;
	for(const category of categories) {
		if(category.id === mainCategoryId)
			continue;
		
		const isCategory = await isCategoryFu(category);
		let line = createElement("div", box, "addon-line");
		line.addEventListener("click", async function() {
			addToCategoryFu(category, !isCategory);
		});
		
		let color = createElement("span", line, "addon-colorPreview");
		color.style.cssText = "background-color: "+category.color;
		color.innerText = isCategory ? "✔" : "";
		
		let categoryName = createElement("a", line);
		categoryName.innerText = category.name;
		
	}
	
	let lineCreate = createElement("button", box, "addon-create");
	lineCreate.innerText = Lang.get("new_category_btn");
	
	lineCreate.addEventListener("click", async function() {
		const newName = window.prompt(Lang.get("prompt_choose_name_for_category"));
		if(!newName) {
			return;
		}
		const color = window.prompt(Lang.get("prompt_choose_color_for_category"), "lightblue");
		if(!color) {
			return;
		}
		
		let category = await StoreDbFrontend.saveCategory(newName, color);
		
		addToCategoryFu(category, true);
	});
	
	return centerBox;
}


function getArticleId() {
	return window.location.href.match(/^.+standard\..+\/story\/(\d+)\//)[1];
}
function getPostingCount() {
	return parseInt(document.getElementById("forum-tb-filter-button").innerText.match(/\((\d+)\)/)[1]);
}
async function analyzeArticle() {
	const articleId = getArticleId()
	let articleDate;
	try {
		articleDate = Date.parse(document.getElementsByClassName("article-pubdate")[0].firstElementChild.getAttribute("datetime").trim())
	}
	catch(e) {
		console.error("Could not extract article date");
		articleDate = Date.now();
	}
	return StoreDbFrontend.saveArticle(articleId, articleDate);
}


async function analyzePostingsAndDraw(article) {
	let divs = listPostingDivs(document);

	for(const div of divs) {
		let state = new UserPostingState(div, article);
		await state.init();
	}
}
function listPostingDivs(doc) {
	return doc.getElementById("postings-container").querySelectorAll("div[data-postingid]");
}
async function getPostingDataFromDiv(postingDiv, article) {
	const parentId = postingDiv.getAttribute("data-parentpostingid");
	const responseLevel = postingDiv.getAttribute("data-level");
	const postingId = postingDiv.getAttribute("data-postingid");
	const userName = postingDiv.getAttribute("data-communityname");
	const userId = postingDiv.getAttribute("data-communityidentityid");
	const postingTimeEl = postingDiv.getElementsByClassName("js-timestamp")[0];
	const postingTimeString = postingTimeEl.hasAttribute("data-date") ? postingTimeEl.getAttribute("data-date") : postingTimeEl.innerText;
	
	const postingTitle = postingDiv.getElementsByClassName("upost-title")[0].innerText;
	const postingMsg = postingDiv.getElementsByClassName("upost-text")[0].innerText;
	
	const posting = await StoreHelper.storePosting(article, parentId, responseLevel, postingId, userId, postingTimeString);
	const user = await StoreDbFrontend.saveUser(userId, userName);
	
	return PostingCache.add(user, posting, postingTitle, postingMsg);
}

//can be null when a posting was deleted
async function getFromPostingCache(article, postingId) {
	let extendedPosting = PostingCache.get(postingId);
	if(extendedPosting !== null)
		return Promise.resolve(extendedPosting);
	else {
		return new Promise(function(resolve, reject) {
			let request = new XMLHttpRequest();
			request.open("get", "https://apps.derstandard.at/forum/1/"+article.articleId+"/"+postingId+"?_="+Date.now())
			request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			
			request.onreadystatechange = async function() {
				if(request.readyState !== 4)
					return;
				if(request.status !== 200) {
					reject();
					return;
				}
				
				let parser = new DOMParser();
				let fakeDoc = parser.parseFromString(request.responseText, "text/html");

				let divs = listPostingDivs(fakeDoc)
				for(let div of divs) {
					await getPostingDataFromDiv(div, article);
				}
				
				resolve(PostingCache.get(postingId));
			}
			
			request.send()
		});
	}
}



let articleInfo;
function closeArticleInfo() {
	articleInfo.close();
}

async function inject () {
	const article = await analyzeArticle();
	articleInfo = new ArticleInfoBox(article);
	
	await analyzePostingsAndDraw(article);
	
	const observer = new MutationObserver(analyzePostingsAndDraw.bind(this, article));
	observer.observe(document.getElementById("postings-container"), {childList: true});
}

async function debugInit() {
	await StoreDbFrontend.reset();
	await init();
}
async function init () {
	console.log("init");
	if(document.getElementById("postings-container") === null || document.getElementById("postings-container").waitingForReset) {
		setTimeout(init, 1000)
	}
	else {
		await inject();
		console.log("initialized Standard User Analyzer");
	}
	
}


// debugInit();
init();