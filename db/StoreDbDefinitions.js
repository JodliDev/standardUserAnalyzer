const MAIN_CATEGORY_NAME = "Alle",
	MAIN_CATEGORY_COLOR = "#ec008c",
	
	TABLE_USER = "users",
	TABLE_ARTICLES = "articles",
	TABLE_POSTINGS = "postings",
	TABLE_POSITIVE_RATINGS = "positiveRatings",
	TABLE_NEGATIVE_RATINGS = "negativeRatings",
	TABLE_CATEGORIES = "categories",
	TABLE_CATEGORY_COUNTER = "categoryCounter",
	
	INDEX_POSTINGS_BY_ARTICLE = "postings:articleId",
	INDEX_POSTINGS_BY_PARENT = "postings:parentId",
	INDEX_POSITIVE_RATINGS_BY_POSTING = "positiveRatings:postingId",
	INDEX_NEGATIVE_RATINGS_BY_POSTING = "negativeRatings:postingId",
	INDEX_CATEGORY_COUNTER_BY_CATEGORY_AND_USER = "categoryCounter:categoryId,userId";