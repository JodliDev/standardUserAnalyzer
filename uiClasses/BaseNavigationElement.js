class BaseNavigationElement {
	article
	static currentBtn;
	btn;
	root;
	
	constructor(article, contentEl, navigationBar, title) {
		const self = this;
		
		this.article = article;
		this.root = contentEl;
		
		this.btn = createElement("div", navigationBar, "addon-expandable");
		this.btn.innerText = title;
		this.btn.onclick = function() {
			if(self.btn.classList.contains("opened"))
				self.close();
			else
				self.open();
		}
	}
	
	fillRoot() {
		throw new Error("fillRoot() was not overridden");
	}
	
	open() {
		this.close();
		this.btn.classList.add("opened");
		BaseNavigationElement.currentBtn = this.btn;
		this.fillRoot();
	}
	close() {
		BaseNavigationElement.close(this.root);
	}
	
	async fillCategoryNavi(onClickFu) {
		const self = this;
		const navi = createElement("div", this.root, "addon-timelineNavi");
		
		const categories = await StoreDbFrontend.getAllCategories();
		let currentCategoryBtn = null;
		for(const category of categories) {
			const btn = createElement("div", navi, "addon-categoryBtn");
			createElement("span", btn, "addon-colorPreview")
				.style.backgroundColor = category.color;
			createElement("span", btn)
				.innerText = category.name;
			
			// btn.innerText = category.name;
			btn.style.borderColor = category.color;
			btn.onclick = function() {
				if(currentCategoryBtn)
					currentCategoryBtn.classList.remove("selected");
				btn.classList.add("selected");
				currentCategoryBtn = btn;
				onClickFu.call(self, category);
			}
		}
		
		navi.getElementsByClassName("addon-categoryBtn")[0].onclick();
		return navi;
	}
	
	
	static close(el) {
		if(BaseNavigationElement.currentBtn) {
			BaseNavigationElement.currentBtn.classList.remove("opened");
			BaseNavigationElement.currentBtn = null;
		}
		while(el.children.length) {
			el.removeChild(el.lastChild);
		}
	}
}