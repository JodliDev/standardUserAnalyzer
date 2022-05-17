'use strict';

function close_on_clickOutside(el) {
	if(el.hasOwnProperty("close-outside"))
		return
	el["close-outside"] = true;
	let closeFu = function() {
		if(!el)
			return false;
		delete el["close-outside"];
		document.removeEventListener("click", click_outside);

		el.parentElement.removeChild(el);

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

function jumpToPosting(articleId, postingId) {
	let id = "script"+Date.now();
	let script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("id", id);

	script.innerHTML = "window.ForumLoader.loadForum({forumKeyType: 1,forumKeyId: '"+articleId+"', selectedPostingId: '"+postingId+"'});document.body.removeChild(document.getElementById('"+id+"'));";
	document.body.appendChild(script);
}

async function drawUserStatistics(user) {
	const table = document.createElement("table");
	let th, td, span;

	const headerTr = document.createElement("tr");
	th = document.createElement("th");
	th.style.cssText = "min-width: 70px";
	headerTr.appendChild(th);
	table.appendChild(headerTr);

	const threadsTr = document.createElement("tr");
	td = document.createElement("th");
	td.innerText = Lang.get("colon_threads");
	threadsTr.appendChild(td);
	table.appendChild(threadsTr);

	const responsesTr = document.createElement("tr");
	td = document.createElement("th");
	td.innerText = Lang.get("colon_responses");
	responsesTr.appendChild(td);
	table.appendChild(responsesTr);

	const didRatingsTr = document.createElement("tr");
	td = document.createElement("th");
	td.innerText = Lang.get("colon_voted");
	didRatingsTr.appendChild(td);
	table.appendChild(didRatingsTr);

	const gotRatingsTr = document.createElement("tr");
	td = document.createElement("th");
	td.innerText = Lang.get("colon_responses");
	gotRatingsTr.appendChild(td);
	table.appendChild(gotRatingsTr);

	const categories = await StoreDbFrontend.getAllCategories();

	for(const categoryId in categories) {
		if(!categories.hasOwnProperty(categoryId))
			continue;
		const category = categories[categoryId];

		th = document.createElement("th");
		th.innerText = category.name;
		th.style.cssText = "text-align:center; min-width: 50px; background-color: "+category.color;
		headerTr.appendChild(th);


		td = document.createElement("td");
		td.innerText = (await StoreHelper.getThreadCount(user.userId, category.id)).toString();
		td.style.cssText = "text-align: center";
		threadsTr.appendChild(td);

		td = document.createElement("td");
		td.innerText = (await StoreHelper.getResponsesCount(user.userId, category.id)).toString();
		td.style.cssText = "text-align: center";
		responsesTr.appendChild(td);

		td = document.createElement("td");
		td.style.cssText = "text-align: center";

		span = document.createElement("span");
		span.innerText = "-"+(await StoreHelper.getGivenNegativeRatingsCount(user.userId, category.id));
		span.style.cssText = "color: red";
		td.appendChild(span);

		span = document.createElement("span");
		span.innerText = "/";
		td.appendChild(span);

		span = document.createElement("span");
		span.innerText = "+"+(await StoreHelper.getGivenPositiveRatingCount(user.userId, category.id));
		span.style.cssText = "color: green";
		td.appendChild(span);

		didRatingsTr.appendChild(td);


		td = document.createElement("td");
		td.style.cssText = "text-align: center";

		span = document.createElement("span");
		span.innerText = "-"+(await StoreHelper.getReceivedNegativeRatingsCount(user.userId, category.id));
		span.style.cssText = "color: red";
		td.appendChild(span);

		span = document.createElement("span");
		span.innerText = "/";
		td.appendChild(span);

		span = document.createElement("span");
		span.innerText = "+"+(await StoreHelper.getReceivedPositiveRatingCount(user.userId, category.id));
		span.style.cssText = "color: green";
		td.appendChild(span);

		gotRatingsTr.appendChild(td);
	}

	return table;
}

async function placeArticleStatistics(article) {
	const communityBox = document.getElementById("story-community");
	const box = await drawArticleStatistics(article);
	box.setAttribute("id", "addOn-articleStatistics");
	box.className = "upost";
	box.style.height = "unset";
	const oldBox = document.getElementById("addOn-articleStatistics");
	if(oldBox)
		oldBox.parentElement.removeChild(oldBox);

	communityBox.insertBefore(box, communityBox.firstChild);
}
function drawTimelineBox(box, article) {
	let clusterSize = 30;
	let timelineBox = document.createElement("div");
	let timelineBoxIsOpened = false;
	
	const createTimeLine = async function(category) {
		let timeLine = document.createElement("div");
		timeLine.className = "upost-body";
		timeLine.style.cssText = "margin-bottom: 10px !important;"
		box.appendChild(timeLine);
		
		timeLine.appendChild(await drawTimeLine(article, category, clusterSize * 60 * 1000));
		
		return timeLine
	};
	
	const closeTimeLine = function() {
		timelineBoxIsOpened = false;
		timelineHeader.innerText = Lang.get("timeline_closed");
		while(timelineBox.children.length) {
			timelineBox.removeChild(timelineBox.lastChild);
		}
	}
	const openTimeLine = async function() {
		closeTimeLine();
		timelineBoxIsOpened = true;
		timelineHeader.innerText = Lang.get("timeline_opened");
		
		let currentTimeline;
		
		const updateTimeLine = async function(category) {
			currentTimeline.parentNode.removeChild(currentTimeline);
			currentTimeline = await createTimeLine(category);
			timelineBox.appendChild(currentTimeline);
		}
		
		//create navi:
		
		const navi = document.createElement("div");
		navi.className = "upost-head";
		navi.style.cssText = "flex-direction: row; justify-content: left;";
		timelineBox.appendChild(navi);
		
		
		const categories = await StoreDbFrontend.getAllCategories();
		for(const category of categories) {
			const btn = document.createElement("div");
			btn.innerText = category.name;
			btn.style.cssText = "cursor: pointer; padding: 5px; margin: 5px; background-color: "+category.color;
			btn.onclick = updateTimeLine.bind(this, category);
			navi.appendChild(btn);
		}
		
		
		//create cluster size:
		
		const clusterSizeBox = document.createElement("div");
		clusterSizeBox.style.cssText = "position: absolute; right: 5px; top: -25px;";
		navi.appendChild(clusterSizeBox);
		
		const clusterSizeLabel = document.createElement("span");
		clusterSizeLabel.innerText = Lang.get("colon_cluster_size");
		clusterSizeLabel.style.cssText = "font-weight: bold";
		clusterSizeBox.appendChild(clusterSizeLabel);
		
		const clusterSizeInput = document.createElement("input");
		clusterSizeInput.style.cssText = "width: 30px; margin: 5px; text-align: right; background-color: unset; border: 1px solid gray;";
		clusterSizeInput.type = "text";
		clusterSizeInput.value = clusterSize;
		clusterSizeInput.onchange = async function() {
			clusterSize = parseInt(clusterSizeInput.value);
			updateTimeLine(mainCategory);
		}
		clusterSizeBox.appendChild(clusterSizeInput);
		
		const clusterSizeDesc = document.createElement("span");
		clusterSizeDesc.innerText = Lang.get("minutes_abr");
		clusterSizeBox.appendChild(clusterSizeDesc);
		
		
		//create timeline:
		
		const mainCategory = await StoreDbFrontend.getMainCategory();
		currentTimeline = await createTimeLine(mainCategory);
		timelineBox.appendChild(currentTimeline);
	}
	
	
	
	const timelineHeader = document.createElement("strong");
	timelineHeader.className = "upost-head";
	timelineHeader.innerText = Lang.get("timeline_closed");
	timelineHeader.style.cssText = "min-height: unset; padding: 5px; font-size: 1em; cursor: pointer;";
	timelineHeader.onclick = function() {
		if(timelineBoxIsOpened)
			closeTimeLine();
		else
			openTimeLine();
	}
	box.appendChild(timelineHeader);
	
	box.appendChild(timelineBox);
}

async function drawArticleStatistics(article) {
	const createChooser = async function() {
		return drawCategoryChooser(
			async function(category) {
				return StoreHelper.articleIsCategory(article, category);
			},
			async function(category, added) {
				if(added) {
					await StoreHelper.addArticleToCategory(article, category.id);
				}
				else {
					await StoreHelper.removeArticleFromCategory(article, category.id);
				}

				const newChooser = await createChooser();
				chooserBox.removeChild(chooserBox.firstElementChild);
				chooserBox.appendChild(newChooser);

				return analyzePostingsAndDraw(article);
			});
	}

	const box = document.createElement("div");
	box.style.cssText = "margin-bottom: 20px;";
	
	
	drawTimelineBox(box, article);


	
	const chooserHeader = document.createElement("strong");
	chooserHeader.className = "upost-head";
	chooserHeader.innerText = Lang.get("article_category");
	chooserHeader.style.cssText = "margin-top: 20px !important; font-size: 1em; padding: 5px; text-align: center";
	box.appendChild(chooserHeader);

	const chooserBox = document.createElement("div");
	box.appendChild(chooserBox);
	chooserBox.appendChild(await createChooser());
	return box;
}

async function drawTimeLine(article, category, CLUSTER_SIZE) {
	const LINE_HEIGHT = 20;

	const postings = await StoreDbFrontend.getPostingsForArticle(article.articleId);
	
	const begin = article.timestamp;
	const end = postings.length ? postings[postings.length-1].timestamp : begin + LINE_HEIGHT;
	const box = document.createElement("div");
	box.style.cssText = "max-height: 300px; overflow: auto; padding-left: 5px; font-size: 8pt; border-left: 5px solid "+category.color;

	const timeline = document.createElement("div");
	timeline.style.cssText = "position:relative; height:"+(Math.round((end-begin) / CLUSTER_SIZE) * LINE_HEIGHT + LINE_HEIGHT)+"px";
	box.appendChild(timeline);


	timeline.appendChild(createTimelineEl(begin, 0));

	const elMap = {};
	console.log(category);
	for(const posting of postings) {
		if(!posting.categories.includes(category.id))
			continue;
		const timePosition = Math.round((posting.timestamp - begin) / CLUSTER_SIZE);
		const position = timePosition * LINE_HEIGHT;

		let line;
		if(elMap.hasOwnProperty(position)) {
			line = elMap[position];
		}
		else {
			line = createTimelineEl(begin + (timePosition * CLUSTER_SIZE), position);
			timeline.appendChild(line);

			elMap[position] = line;
		}


		const user = await StoreDbFrontend.getUser(posting.userId);
		const postingA = document.createElement("a");
		postingA.target = "_blank";
		postingA.href = "https://derstandard.at/permalink/p/"+posting.postingId;
		postingA.style.cssText = "margin-left: 10px;";

		const tagName = "addon-user-"+user.userId;
		postingA.className = tagName;
		postingA.onclick = function(e) {
			e.preventDefault();
			jumpToPosting(article.articleId, posting.postingId);
		};
		postingA.onmouseenter = function() {
			const els = document.getElementsByClassName(tagName);
			for(const el of els) {
				el.style.backgroundColor = "#ff000055";
			}
		};
		postingA.onmouseleave = function() {
			const els = document.getElementsByClassName(tagName);
			for(const el of els) {
				el.style.backgroundColor = "unset";
			}
		};

		if(posting.isThread) {
			postingA.style.fontWeight = "bold";
		}
		postingA.innerText = user.name;
		line.appendChild(postingA);
	}

	return box;
}
function createTimelineEl(timestamp, position) {
	const line = document.createElement("div");
	line.style.cssText = "position:absolute; width: 100%; display: flex; flex-direction: row; flex-wrap: nowrap; white-space: nowrap; justify-content: left; top:" + (position) + "px";

	const timeEl = document.createElement("span");
	timeEl.style.cssText = "font-weight: bold";
	timeEl.innerText = new Date(timestamp).toLocaleString("default", {dateStyle: "short", timeStyle: "short"}) + ":";
	line.appendChild(timeEl);

	return line;
}

async function analyzeArticle() {
	const articleId = window.location.href.match(/^.+standard\..+\/story\/(\d+)\//)[1];
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
	let divs = document.getElementById("postings-container").querySelectorAll("div[data-postingid]");

	for(const div of divs) {
		await processPosting(div, article);
	}

	await placeArticleStatistics(article);
	placeAutomateBtn();
}
async function processPosting(postingDiv, article) {
	const threadId = postingDiv.getAttribute("data-parentpostingid");
	const postingId = postingDiv.getAttribute("data-postingid");
	const userName = postingDiv.getAttribute("data-communityname");
	const userId = postingDiv.getAttribute("data-communityidentityid");
	const postingTimeEl = postingDiv.getElementsByClassName("js-timestamp")[0];
	const postingTimeString = postingTimeEl.hasAttribute("data-date") ? postingTimeEl.getAttribute("data-date") : postingTimeEl.innerText;

	//
	//update data:
	//
	const posting = await StoreHelper.storePosting(article, threadId, postingId, userId, postingTimeString);
	const user = await StoreDbFrontend.saveUser(userId, userName);

	//
	//add menu:
	//
	const header = postingDiv.getElementsByClassName("upost-head")[0];

	const oldBtnBox = header.getElementsByClassName("addOn-btnBox");
	if(oldBtnBox.length)
		oldBtnBox[0].parentNode.removeChild(oldBtnBox[0]);

	const btnBox = document.createElement("div");
	btnBox.classList.add("addOn-btnBox");
	btnBox.style.cssText = "display: flex;  cursor: pointer; align-items: center; margin-left: 10px;";
	btnBox.addEventListener("click", openPostingCategoryMenu.bind(btnBox, header, postingDiv, posting, user));


	const categories = await StoreHelper.getPostingCategories(posting);
	for(const categoryId of categories) {
		const category = await StoreDbFrontend.getCategory(categoryId);
		const colorEl = document.createElement("div");
		colorEl.style.cssText = "width: 15px; height: 15px; border: 1px solid gray; margin: 1px; background-color: "+category.color;
		btnBox.appendChild(colorEl);
	}

	header.appendChild(btnBox);


	//
	//watch for opened ratings
	//
	const observer = new MutationObserver(processRatings.bind(this, posting));
	const ratingEl = postingDiv.getElementsByClassName("ratings")[0];
	observer.observe(ratingEl, {childList: true});
}

async function processRatings(posting) {
	let box = document.getElementById("js-ratings-log-entries");
	if(!box || box.isProcessing) {
		return;
	}
	box.isProcessing = true

	let form = box.parentNode;
	let button = form.getElementsByClassName("ratings-log-showmore")[0];
	while(button) {
		fireEvent(form, new SubmitEvent("submit", {submitter: button, bubbles: true, cancelable: true}));
		await waitForElementChange(box);
		button = box.getElementsByClassName("ratings-log-showmore")[0];
	}

	const children = box.children;
	const positiveIndex = {};
	const negativeIndex = {};
	for(let i=children.length-1; i>=0; --i) {
		const line = children[i];
		const userId = line.getElementsByTagName("button")[0].getAttribute("data-communityidentityid");
		const rating = line.getAttribute("data-rate");

		if(rating === "positive") {
			positiveIndex[userId] = true;
		}
		else if(rating === "negative") {
			negativeIndex[userId] = true;
		}
	}

	await StoreHelper.doRatingsForPosting(posting, positiveIndex, negativeIndex);
	box.isProcessing = false;

	RatingsHelper.continueRatings(posting.postingId);
}

async function openPostingCategoryMenu(parent, postingDiv, posting, user, event) {
	let menu = document.createElement("div");
	menu.className = "ratings-log";

	let closeFu = close_on_clickOutside(menu);
	let saveAndReload = async function() {
		await processPosting(postingDiv, await StoreDbFrontend.getArticle(posting.articleId));
		closeFu();
		openPostingCategoryMenu(parent, postingDiv, posting, user, event);
		placeArticleStatistics(await StoreDbFrontend.getArticle(posting.articleId));
	}

	//
	//draw statistics
	//
	const statisticsHeader = document.createElement("h3");
	statisticsHeader.style.cssText = "text-align: center";
	statisticsHeader.innerText = user.name;
	menu.appendChild(statisticsHeader);

	const statistics = document.createElement("div");
	statistics.style.cssText = "width: 100%; overflow-x: auto;";
	const table = await drawUserStatistics(user);
	statistics.appendChild(table);
	menu.appendChild(statistics);

	//
	//draw categories:
	//
	const categoryHeader = document.createElement("h3");
	categoryHeader.style.cssText = "text-align: center";
	categoryHeader.innerText = Lang.get("posting_categories");
	menu.appendChild(categoryHeader);



	const categoryEl = await drawCategoryChooser(async function(category) {
			return StoreHelper.postingIsCategory(posting, category);
		},
		async function(category, added) {
			if(added) {
				await StoreHelper.addPostingToCategory(posting, category.id);
			}
			else {
				await StoreHelper.removePostingFromCategory(posting, category.id);
			}

			await saveAndReload();
		});

	menu.appendChild(categoryEl);


	parent.appendChild(menu);
}

async function drawCategoryChooser(isCategoryFu, addToCategoryFu) {
	let categories = await StoreDbFrontend.getAllCategories();
	let box = document.createElement("div");
	box.className = "upost-body";

	for(const category of categories) {
		if(category.id === (await StoreDbFrontend.getMainCategory()).id) {
			continue;
		}
		const isCategory = await isCategoryFu(category);
		let line = document.createElement("div");
		line.style.cssText = "display: flex; justify-content: start; align-items: center; cursor: pointer;";

		let color = document.createElement("span");
		color.style.cssText = "width: 20px; height: 20px; line-height: 20px; font-size: 15px; margin: 5px 10px 5px 5px; text-align: center; background-color: "+category.color;
		color.innerText = isCategory ? "✔" : "";
		line.appendChild(color);

		let categoryName = document.createElement("a");
		categoryName.style.cssText = "flex-grow: 1;";
		categoryName.innerText = category.name;

		line.addEventListener("click", async function() {
			addToCategoryFu(category, !isCategory);
		});
		line.appendChild(categoryName);

		box.appendChild(line);
	}

	let lineCreate = document.createElement("div");
	lineCreate.style.cssText = "display: flex; justify-content: center; padding: 5px; cursor: pointer;";
	let name = document.createElement("a");
	name.style.cssText = "flex-grow: 1; text-align: center;";
	name.innerText = Lang.get("new_category_btn");
	lineCreate.appendChild(name);

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
	box.appendChild(lineCreate);

	return box;
}

function placeAutomateBtn() {
	const oldBtn = document.getElementById("addon-automatBtn");
	if(oldBtn)
		oldBtn.parentNode.removeChild(oldBtn);
	const btnLine = document.getElementsByClassName("forum-tb-tools")[0];

	if(!btnLine)
		return;

	const btn = document.createElement("div");
	btn.setAttribute("id", "addon-automatBtn");
	btn.style.cssText = "width: 20px; height: 20px; font-size: 20px; padding: 5px; cursor: pointer;";
	btn.title = Lang.get("automatically_scan_article");
	btn.innerText = "♻";
	btn.onclick = async function() {
		await automate();
	};
	btnLine.appendChild(btn);
}

async function automate() {
	const loader = new Loader();
	let startBtn = document.getElementsByClassName("forum-tb-btnstart ")[0];
	if(!startBtn.disabled) {
		loader.setContent(Lang.get("go_to_first_page"));
		fireEvent(startBtn);
		await waitForElementChange(document.getElementById("postings-container"));
	}

	if(loader.isClosed())
		return;

	let nextBtn = document.getElementsByClassName("forum-tb-btnnext")[0];

	do {
		await automaticRatings(loader);

		if(!nextBtn.disabled) {
			loader.setContent(Lang.get("go_to_page_x", parseInt(document.getElementById("CurrentPage").value) + 1));
			fireEvent(nextBtn);
			await waitForElementChange(document.getElementById("postings-container"));
			nextBtn = document.getElementsByClassName("forum-tb-btnnext")[0];
		}
		if(loader.isClosed())
			return;
	} while(!nextBtn.disabled);

	loader.close();
}
async function automaticRatings(loader) {
	const elements = document.getElementsByClassName("ratings-counts");

	let count = 0;
	const max = elements.length;
	for(const el of elements) {
		if(el.classList.contains("ratings-counts-empty"))
			continue;
		++count;
		loader.setContent(Lang.get("info_load_rating", parseInt(document.getElementById("CurrentPage").value), count, max));
		fireEvent(el);

		let postingId = el.getAttribute("data-closable-target").match(/-(\d+)$/)[1];
		await RatingsHelper.waitForRatings(postingId);

		if(loader.isClosed())
			return;
	}
}


async function inject () {
	const article = await analyzeArticle();
	
	await analyzePostingsAndDraw(article);
	

	const observer = new MutationObserver(analyzePostingsAndDraw.bind(this, article));

	observer.observe(document.getElementById("postings-container"), {childList: true});
}

async function debugInit() {
	await StoreDbFrontend.reset();
	await init();
}
async function init () {
	if(document.getElementById("postings-container") === null) {
		setTimeout(init, 1000)
	}
	else {
		await inject();
		console.log("initialized Standard User Analyzer");
	}
	
}


// debugInit();
init();