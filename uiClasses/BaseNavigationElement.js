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