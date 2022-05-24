class Timeline extends BaseNavigationElement {
	LINE_HEIGHT = 20;
	currentClusterSize = 30;
	currentTimeline;
	
	constructor(article, contentEl, navigationBar) {
		super(article, contentEl, navigationBar, Lang.get("timeline_btn"));
	}
	
	async createTimeline(category) {
		const self = this;
		let clusterSizeMs = this.currentClusterSize * 60 * 1000;
		
		const postings = await StoreDbFrontend.getPostingsForArticle(this.article.articleId);
		const begin = postings.length ? postings[0].timestamp : this.article.timestamp;
		const box = createElement("div", null, "addon-timeline");
		box.style.cssText = "border-left: 5px solid "+category.color;
		
		if(postings.length < getPostingCount()) {
			const warn = createElement("div", box, "addon-highlight");
			warn.innerText = Lang.get("only_showing_x_postings", postings.length, getPostingCount());
		}
		
		const timeline = createElement("div", box);
		
		
		let currentChunkTime = begin;
		let currentLine = this.createTimelineSubElement(currentChunkTime);
		timeline.appendChild(currentLine);
		
		
		for(const posting of postings) {
			if(!posting.categories.includes(category.id))
				continue;
			if(posting.timestamp > currentChunkTime + clusterSizeMs) {
				let clusterDifference = Math.floor((posting.timestamp - currentChunkTime) / clusterSizeMs);
				currentChunkTime += clusterDifference * clusterSizeMs;
				
				let spacer = createElement("div", timeline);
				spacer.style.height = ((clusterDifference-1) * this.LINE_HEIGHT)+"px";
				currentLine = this.createTimelineSubElement(currentChunkTime);
				timeline.appendChild(currentLine);
			}
			await this.insertTimelinePostingElement(posting, currentLine);
		}
		
		return box;
	}
	createTimelineSubElement(timestamp) {
		const line = createElement("div", null, "addon-line");
		
		const timeEl = createElement("span", line, "dateTime");
		timeEl.innerText = new Date(timestamp).toLocaleString("default", {dateStyle: "short", timeStyle: "short"}) + ":";
		
		return line;
	}
	async insertTimelinePostingElement(posting, currentLine) {
		const self = this;
		const user = await StoreDbFrontend.getUser(posting.userId);
		const tagName = "addon-user-"+user.userId;
		const postingA = createElement("a", currentLine, tagName);
		postingA.setAttribute("username", user.name);
		postingA.target = "_blank";
		postingA.href = "https://derstandard.at/permalink/p/"+posting.postingId;
		
		postingA.onclick = function(e) {
			e.preventDefault();
			if(postingA.classList.contains("dropdown-opened"))
				return;
			self.drawPostingDropdown(postingA, self.article, posting);
		};
		postingA.onmouseenter = function() {
			const els = document.getElementsByClassName(tagName);
			for(const el of els) {
				el.classList.add("mouseenter");
			}
		};
		postingA.onmouseleave = function() {
			const els = document.getElementsByClassName(tagName);
			for(const el of els) {
				el.classList.remove("mouseenter");
			}
		};
		
		if(posting.isThread) {
			postingA.classList.add("isThread");
		}
		postingA.innerText = user.name;
	}
	
	async drawPostingDropdown(locationEl, article, posting) {
		const self = this;
		const dropdownEl = createFloatingDropdown(locationEl);
		
		const extendedPosting = await getFromPostingCache(article, posting.postingId);
		
		if(!extendedPosting) {
			dropdownEl.innerText = Lang.get("posting_does_not_exist");
			return;
		}
		
		if(extendedPosting.posting.parentId) {
			const parentExtendedPosting = await getFromPostingCache(article, extendedPosting.posting.parentId);
			dropdownEl.appendChild(await this.createPostingEl(parentExtendedPosting, dropdownEl));
		}
		
		dropdownEl.appendChild(await this.createPostingEl(extendedPosting, dropdownEl, true));
		let responses = await StoreDbFrontend.getPostingsForThread(extendedPosting.posting.postingId);
		let promise = Promise.resolve();
		for(let responsePosting of responses) {
			promise = promise.then(async function() {
				const extendedResponsePosting = await getFromPostingCache(article, responsePosting.postingId);
				
				dropdownEl.appendChild(await self.createPostingEl(extendedResponsePosting, dropdownEl));
				if(await StoreDbFrontend.hasResponses(responsePosting.postingId)) {
					let div = createElement("div", dropdownEl, "upost upost-is-expanded upost-is-reply");
					div.setAttribute("data-level", responsePosting.responseLevel + 1);
					let content = createElement("div", div, "upost-content")
					let body = createElement("div", content, "upost-body addon-emptyPostingBody")
					body.innerText = "...";
					body.onclick = function() {
						jumpToPosting(responsePosting.postingId);
						dropdownEl.close();
					};
				}
			});
		}
		
		return dropdownEl;
	}
	
	
	async createPostingEl(extendedPosting, dropdownEl, isHighlighted) {
		const postingDiv = document.createElement("div");
		postingDiv.classList.add("upost", "upost-is-expanded");
		postingDiv.setAttribute("data-level", extendedPosting.posting.responseLevel);
		if(!extendedPosting.posting.isThread) {
			postingDiv.classList.add("upost-is-reply");
		}
		if(isHighlighted)
			postingDiv.setAttribute("data-is-selected", "true");
		
		const postingContentEl = createElement("div", postingDiv, "upost-content");
		
		
		const userEl = createElement("div", postingContentEl, "upost-head");
		
		const userContainerUserNameEl = createElement("div", userEl, "upost-usercontainer");
		createElement("strong", userContainerUserNameEl)
			.innerText = extendedPosting.user.name;
		
		const userContainerDateEl = createElement("div", userEl, "upost-usercontainer");
		const userDateEl = createElement("span", userContainerDateEl);
		const date = new Date(extendedPosting.posting.timestamp);
		userDateEl.innerText = date.toLocaleDateString() + ", " + date.toLocaleTimeString();
		userDateEl.style.marginLeft = "10px";
		
		
		const postingBodyEl = createElement("div", postingContentEl, "upost-body");
		
		
		if(extendedPosting.title) {
			createElement("h4", postingBodyEl, "upost-title")
				.innerText = extendedPosting.title;
		}
		
		if(extendedPosting.msg) {
			createElement("div", postingBodyEl, "upost-text")
				.innerText = extendedPosting.msg;
		}
		
		createElement("div", postingBodyEl, "addon-gotoBtn")
			.onclick = function() {
				jumpToPosting(extendedPosting.posting.postingId);
				dropdownEl.close();
			};
		
		const userState = new UserPostingState(postingDiv, this.article);
		await userState.init(extendedPosting);
		
		return postingDiv;
	}
	
	async updateTimeLine(category) {
		this.currentTimeline.parentNode.removeChild(this.currentTimeline);
		this.currentTimeline = await this.createTimeline(category);
		this.root.appendChild(this.currentTimeline);
	}
	
	async fillRoot() {
		const self = this;
		
		//create navi:
		
		const navi = createElement("div", this.root, "addon-timelineNavi");
		
		const categories = await StoreDbFrontend.getAllCategories();
		for(const category of categories) {
			const btn = createElement("div", navi, "addon-categoryBtn");
			btn.innerText = category.name;
			btn.style.cssText = "background-color: "+category.color;
			btn.onclick = this.updateTimeLine.bind(this, category);
		}
		
		
		//create user filter
		
		const filter = createElement("div", navi, "addon-filterBox");
		
		const filterLabel = createElement("span", filter, "label");
		filterLabel.innerText = Lang.get("colon_filter_user");
		
		const filterInput = createElement("input", filterLabel);
		filterInput.type = "text";
		filterInput.onkeyup = async function() {
			const elements = self.currentTimeline.getElementsByTagName("a");
			const searchString = filterInput.value;
			for(const el of elements) {
				el.style.display = el.getAttribute("username").startsWith(searchString) ? "block" : "none";
			}
		}
		
		
		//create cluster size:
		
		const clusterSizeBox = createElement("div", navi, "addon-clusterSizeBox");
		
		const clusterSizeLabel = createElement("span", clusterSizeBox, "label");
		clusterSizeLabel.innerText = Lang.get("colon_cluster_size");
		
		const clusterSizeInput = createElement("input", clusterSizeBox);
		clusterSizeInput.type = "text";
		clusterSizeInput.value = this.currentClusterSize;
		clusterSizeInput.onchange = async function() {
			self.currentClusterSize = parseInt(clusterSizeInput.value);
			await self.updateTimeLine(mainCategory);
		}
		
		const clusterSizeDesc = createElement("span", clusterSizeBox);
		clusterSizeDesc.innerText = Lang.get("minutes_abr");
		
		
		//create timeline:
		
		const mainCategory = await StoreDbFrontend.getMainCategory();
		this.currentTimeline = await this.createTimeline(mainCategory);
		this.root.appendChild(this.currentTimeline);
	}
}