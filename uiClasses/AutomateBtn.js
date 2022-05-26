class AutomateBtn extends BaseNavigationElement {
	startAutomationBtn;
	stateEl;
	isRunning;
	skipRatings;
	
	constructor(article, contentEl, navigationBar) {
		super(article, contentEl, navigationBar, Lang.get("scan_article"));
	}
	
	blockEvents(e) {
		e.preventDefault();
		e.stopPropagation();
	}
	
	getCurrentPage() {
		return parseInt(document.getElementById("CurrentPage").value);
	}
	getMaxPages() {
		return Math.ceil(getPostingCount() / 25);
	}
	
	async start() {
		document.body.addEventListener("click", this.blockEvents);
		
		this.isRunning = true;
		document.getElementById("postings-container").style.display = "none";
		document.getElementById("addon-root").scrollIntoView();
		
		//go to first page if needed:
		let startBtn = document.getElementsByClassName("forum-tb-btnstart ")[0];
		if(!startBtn.disabled) {
			this.setState(Lang.get("go_to_first_page"));
			fireEvent(startBtn);
			// await waitForElementChange(document.getElementById("postings-container"));
			await LoadPageHelper.wait();
			document.getElementById("addon-root").scrollIntoView();
		}
		
		
		let nextBtn = document.getElementsByClassName("forum-tb-btnnext")[0];
		
		do {
			if(!this.skipRatings)
				await this.automaticRatings();
			
			if(!nextBtn.disabled && this.isRunning) {
				this.setState(Lang.get("go_to_page_x_of_x", this.getCurrentPage() + 1, this.getMaxPages()));
				fireEvent(nextBtn);
				// await waitForElementChange(document.getElementById("postings-container"));
				await LoadPageHelper.wait();
				document.getElementById("addon-root").scrollIntoView();
				nextBtn = document.getElementsByClassName("forum-tb-btnnext")[0];
			}
			
		} while(!nextBtn.disabled && this.isRunning);
		
		this.stop();
	}
	async automaticRatings() {
		const elements = document.getElementById("postings-container").getElementsByClassName("ratings-counts");
		
		let count = 0;
		const max = elements.length;
		for(const el of elements) {
			++count;
			if(el.classList.contains("ratings-counts-empty"))
				continue;
			this.setState(Lang.get("info_load_rating", this.getCurrentPage(), this.getMaxPages(), count, max));
			
			let postingId = el.getAttribute("data-closable-target").match(/-(\d+)$/)[1];
			
			const dbRatings = await StoreDbFrontend.countRatingsForPosting(postingId);
			const positiveRating = el.getElementsByClassName("ratings-positive-count")[0].innerText;
			const negativeRating = el.getElementsByClassName("ratings-negative-count")[0].innerText;
			
			if(dbRatings.positive !== positiveRating || dbRatings.negative !== negativeRating) {
				fireEvent(el);
				console.log("await", postingId, el);
				try {
					await LoadRatingsHelper.wait(postingId);
				}
				catch(e) {
					console.error("Ratings for posting "+postingId+" did not finish properly!", el);
				}
				fireEvent(el);
			}
			
			if(!this.isRunning)
				return;
		}
	}
	
	stop() {
		this.isRunning = false;
		document.getElementById("postings-container").style.display = "block";
		document.body.removeEventListener("click", this.blockEvents);
		this.close();
		this.open();
	}
	
	setState(msg) {
		this.stateEl.innerText = msg;
	}
	
	
	async fillRoot() {
		const self = this;
		
		const mainElement = createElement("div", this.root, "addon-automation");
		
		const desc = createElement("div", mainElement);
		desc.innerText = Lang.get("automate_description");
		
		
		const menu = createElement("div", mainElement, "addon-menu");
		const state = createElement("div", menu, "addon-highlight");
		state.innerText = Lang.get("posting_scanned_state", (await StoreDbFrontend.countPostingsForArticle(this.article.articleId)), getPostingCount());
		
		const checkbox = createElement("input", menu);
		checkbox.type = "checkbox";
		checkbox.id = "addon-skipRatingsCheckbox";
		checkbox.checked = this.skipRatings
		checkbox.onchange = function() {
			self.skipRatings = checkbox.checked;
		}
		
		const label = createElement("label", menu);
		label.setAttribute("for", "addon-skipRatingsCheckbox");
		label.innerText = Lang.get("skip_ratings");
		
		
		const startAutomationBtn = createElement("button", mainElement, "addon-startAutomation");
		startAutomationBtn.innerText = Lang.get(self.isRunning ? "cancel" : "start_scanning");
		startAutomationBtn.onclick = async function() {
			if(self.isRunning)
				self.stop();
			else {
				startAutomationBtn.innerText = Lang.get("cancel");
				await self.start();
			}
		};
		
		this.stateEl = createElement("div", mainElement);
	}
}