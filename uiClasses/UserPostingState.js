class UserPostingState {
	postingDiv;
	article;
	extendedPostingData;
	btnBox
	
	constructor(postingDiv, article) {
		this.postingDiv = postingDiv;
		this.article = article;
	}
	
	async init(extendedPostingData) {
		const self = this;
		this.extendedPostingData = extendedPostingData || await getPostingDataFromDiv(this.postingDiv, this.article);
		const posting = this.extendedPostingData.posting;
		//
		//add menu:
		//
		// console.log(this.postingDiv);
		// console.log(this.postingDiv.getElementsByClassName("upost-postingcontainer")[);
		const header = this.postingDiv.getElementsByClassName("upost-postingcontainer")[0];
		
		const oldBtnBox = header.getElementsByClassName("addOn-btnBox");
		if(oldBtnBox.length)
			oldBtnBox[0].parentNode.removeChild(oldBtnBox[0]);
		
		this.btnBox = createElement("div", header, "addOn-btnBox");
		this.btnBox.onclick = function() {
			if(!self.btnBox.classList.contains("dropdown-opened"))
				self.openPostingCategoryMenu();
		}
		
		const categories = await StoreHelper.getPostingCategories(posting);
		for(const categoryId of categories) {
			const category = await StoreDbFrontend.getCategory(categoryId);
			const colorEl = createElement("div", this.btnBox, "addon-categoryRectangle");
			colorEl.style.cssText = "background-color: "+category.color;
			this.btnBox.appendChild(colorEl);
		}
		
		
		
		//
		//watch for opened ratings
		//
		const ratingEl = this.postingDiv.getElementsByClassName("ratings")[0];
		
		if(ratingEl) {
			const observer = new MutationObserver(this.processRatings.bind(this, ratingEl));
			observer.observe(ratingEl, {childList: true});
		}
	}
	
	async processRatings(ratingEl) {
		const box = ratingEl.getElementsByTagName("ul")[0];
		if(!box || box.isProcessing) {
			return;
		}
		box.isProcessing = true;
		
		const posting = this.extendedPostingData.posting;
		
		const form = box.parentNode;
		let button = form.getElementsByClassName("ratings-log-showmore")[0];
		while(button) {
			fireEvent(form, new SubmitEvent("submit", {submitter: button, bubbles: true, cancelable: true}));
			try {
				await waitForElementChange(box);
			}
			catch(e) {
				console.error("Timeout while awaiting changed ratings for posting "+posting.postingId);
				LoadRatingsHelper.fail(posting.postingId);
				break;
			}
			button = box.getElementsByClassName("ratings-log-showmore")[0];
		}
		
		const children = box.children;
		const positiveIndex = {};
		const negativeIndex = {};
		for(let i=children.length-1; i>=0; --i) {
			const line = children[i];
			const button = line.getElementsByTagName("button"); //can be 0 on deleted profile
			const userId = button.length ? button[0].getAttribute("data-communityidentityid") : 0;
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
		
		LoadRatingsHelper.continue(posting.postingId);
	}
	
	async openPostingCategoryMenu() {
		const self = this;
		const user = this.extendedPostingData.user;
		const posting = this.extendedPostingData.posting;
		const dropdown = createFloatingDropdown(this.btnBox);
		
		let saveAndReload = async function() {
			await self.init(self.extendedPostingData);
			dropdown.close();
			await self.openPostingCategoryMenu();
		}
		
		//
		//draw statistics
		//
		const statisticsHeader = createElement("div", dropdown, "addon-header");
		statisticsHeader.innerText = user.name;
		
		const statistics = createElement("div", dropdown, "addon-userStatisticsWindow addon-center");
		statistics.appendChild(await this.drawUserStatistics(user));
		
		//
		//draw categories:
		//
		const categoryHeader = createElement("div", dropdown, "addon-header");
		categoryHeader.innerText = Lang.get("posting_categories");
		
		
		
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
		
		dropdown.appendChild(categoryEl);
	}
	
	async drawUserStatistics(user) {
		const table = createElement("table", null, "addon-userStatistics addon-centerContent");
		let th, td, span;
		
		const headerTr = createElement("tr", table);
		createElement("th", headerTr);
		
		const threadsTr = createElement("tr", table);
		td = createElement("th", threadsTr);
		td.innerText = Lang.get("colon_threads");
		
		const responsesTr = createElement("tr", table);
		td = createElement("th", responsesTr);
		td.innerText = Lang.get("colon_responses");
		
		const didRatingsTr = createElement("tr", table);
		td = createElement("th", didRatingsTr);
		td.innerText = Lang.get("colon_voted");
		
		const gotRatingsTr = createElement("tr", table);
		td = createElement("th", gotRatingsTr);
		td.innerText = Lang.get("colon_was_voted");
		
		const categories = await StoreDbFrontend.getAllCategories();
		
		for(const categoryId in categories) {
			if(!categories.hasOwnProperty(categoryId))
				continue;
			const category = categories[categoryId];
			
			th = createElement("th", headerTr, "columnTitle");
			th.innerText = category.name;
			th.style.cssText = "background-color: "+category.color;
			
			
			td = createElement("td", threadsTr);
			td.innerText = (await StoreHelper.getThreadCount(user.userId, category.id)).toString();
			
			td = createElement("td", responsesTr);
			td.innerText = (await StoreHelper.getResponsesCount(user.userId, category.id)).toString();
			
			td = createElement("td", didRatingsTr);
			
			span = createElement("span", td, "addon-ratingNegative");
			span.innerText = await StoreHelper.getGivenNegativeRatingsCount(user.userId, category.id);
			
			span = createElement("span", td);
			span.innerText = "/";
			
			span = createElement("span", td, "addon-ratingPositive");
			span.innerText = await StoreHelper.getGivenPositiveRatingCount(user.userId, category.id);
			
			
			td = createElement("td", gotRatingsTr);
			
			span = createElement("span", td, "addon-ratingNegative");
			span.innerText = await StoreHelper.getReceivedNegativeRatingsCount(user.userId, category.id);
			
			span = createElement("span", td);
			span.innerText = "/";
			
			span = createElement("span", td, "addon-ratingPositive");
			span.innerText = await StoreHelper.getReceivedPositiveRatingCount(user.userId, category.id);
		}
		
		return table;
	}
}