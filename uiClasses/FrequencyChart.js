class FrequencyChart extends BaseNavigationElement {
	chartWindowEl;
	currentCategory;
	currentChart;
	threadData;
	responsesData;
	
	constructor(article, contentEl, navigationBar) {
		super(article, contentEl, navigationBar, Lang.get("frequencies"));
	}
	
	async intoDataSets(counter) {
		const data = [];
		for(const userId in counter) {
			if(!counter.hasOwnProperty(userId))
				continue;
			const count = counter[userId];
			const user = await StoreDbFrontend.getUser(userId);
			data.push({y: user.name, x: count});
		}
		return data;
	}
	
	createDataSet() {
		const threadDataset = {
			label: Lang.get("threads"),
			data: this.threadData,
			backgroundColor: ["rgb(0,121,194)"]
		};
		const responseDataset = {
			label: Lang.get("responses"),
			data: this.responsesData,
			backgroundColor: ["rgb(255,219,84)"]
		};
		
		
		const sortBy = document.querySelector('input[name="addon-sortBy"]:checked').value;
		let sortData, datasets;
		if(sortBy === "threads") {
			sortData = this.threadData
			datasets = [threadDataset, responseDataset];
		}
		else {
			sortData = this.responsesData
			datasets = [responseDataset, threadDataset];
		}
		
		sortData.sort(function(a, b) {
			return b.x - a.x;
		});
		
		return datasets;
	}
	
	async createChart(category) {
		const entryHeight = 30;
		this.currentCategory = category;
		
		while(this.chartWindowEl.children.length) {
			this.chartWindowEl.removeChild(this.chartWindowEl.lastChild);
		}
		
		const postings = await StoreDbFrontend.getPostingsForArticle(this.article.articleId);
		if(postings.length < getPostingCount()) {
			const warn = createElement("div", this.chartWindowEl, "addon-highlight");
			warn.innerText = Lang.get("only_showing_x_postings", postings.length, getPostingCount());
		}
		
		const threadCounter = {}
		const responsesCounter = {}
		for(const posting of postings) {
			if(!posting.categories.includes(category.id))
				continue;
			const userId = posting.userId;
			const counter = (posting.isThread) ? threadCounter : responsesCounter;
			
			if(!counter.hasOwnProperty(userId))
				counter[userId] = 1;
			else
				++counter[userId];
		}
		
		
		this.threadData = await this.intoDataSets(threadCounter);
		this.responsesData = await this.intoDataSets(responsesCounter);
		
		const datasets = this.createDataSet();
		
		
		const chartEl = createElement("canvas", this.chartWindowEl);
		chartEl.height = Math.max(this.threadData.length, this.responsesData.length) * entryHeight;
		this.currentChart = new Chart(chartEl.getContext("2d"), {
			type: "bar",
			data: {
				datasets: datasets
			},
			options: {
				indexAxis: 'y',
			}
		});
	}
	
	async fillRoot() {
		const self = this;
		this.chartWindowEl = createElement("div", null, "addon-chartWindow");
		const navi = await this.fillCategoryNavi(this.createChart);
		const navi2 = createElement("div", this.root, "addon-timelineNavi");

		
		const sort = createElement("div", navi2, "addon-sortBy");
		sort.innerText = Lang.get("colon_sort_by");
		
		
		let sortLabel = createElement("label", sort);
		let sortInput = createElement("input", sortLabel);
		sortInput.type = "radio";
		sortInput.name = "addon-sortBy";
		sortInput.value = "threads";
		sortInput.checked = true;
		sortInput.onchange = function() {
			self.currentChart.data.datasets = self.createDataSet();
			self.currentChart.update();
		};
		
		let sortText = createElement("span", sortLabel);
		sortText.innerText = Lang.get("threads");
		
		
		sortLabel = createElement("label", sort);
		sortInput = createElement("input", sortLabel);
		sortInput.type = "radio";
		sortInput.name = "addon-sortBy";
		sortInput.value = "responses";
		sortInput.onchange = function() {
			self.currentChart.data.datasets = self.createDataSet();
			self.currentChart.update();
		};
		
		sortText = createElement("span", sortLabel);
		sortText.innerText = Lang.get("responses");
		
		
		//chart:
		this.root.appendChild(this.chartWindowEl);
		// await this.createChart(await StoreDbFrontend.getMainCategory());
	}
}