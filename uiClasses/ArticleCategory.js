class ArticleCategory extends BaseNavigationElement {
	constructor(article, contentEl, navigationBar) {
		super(article, contentEl, navigationBar, Lang.get("article_category"));
	}
	
	
	
	async fillRoot() {
		const self = this;
		
		let el = await drawCategoryChooser(
			async function(category) {
				return StoreHelper.articleIsCategory(self.article, category);
			},
			async function(category, added) {
				if(added) {
					await StoreHelper.addArticleToCategory(self.article, category.id);
				}
				else {
					await StoreHelper.removeArticleFromCategory(self.article, category.id);
				}
				
				self.close();
				self.open();
				
				return analyzePostingsAndDraw(self.article);
			});
		
		
		el.classList.add("addon-articleCategory");
		this.root.appendChild(el);
	}
}