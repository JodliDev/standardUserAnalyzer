'use strict';

const StoreDbFrontend = new function() {
	const MAIN_CATEGORY_NAME = "Alle",
		MAIN_CATEGORY_COLOR = "gray",
		
		TABLE_USER = "users",
		TABLE_ARTICLES = "articles",
		TABLE_POSTINGS = "postings",
		TABLE_POSITIVE_RATINGS = "positiveRatings",
		TABLE_NEGATIVE_RATINGS = "negativeRatings",
		TABLE_CATEGORIES = "categories",
		TABLE_CATEGORY_COUNTER = "categoryCounter",
		
		INDEX_POSTINGS_BY_ARTICLE = "postingId:articleId",
		INDEX_POSITIVE_RATINGS_BY_POSTING = "positiveRatings:postingId",
		INDEX_NEGATIVE_RATINGS_BY_POSTING = "negativeRatings:postingId",
		INDEX_CATEGORY_COUNTER_BY_CATEGORY_AND_USER = "categoryCounter:categoryId,userId";
	
	const getAll = function(tableName, indexName, indexValue) {
			return sendMessage({
				type: "getAll",
				tableName: tableName,
				indexName: indexName,
				value: indexValue
			});
		},
		getObjByKey = function(tableName, indexName, key) {
			return sendMessage({
				type: "getObjByKey",
				tableName: tableName,
				indexName: indexName,
				key: key
			});
		},
		saveObj = function(tableName, obj, overwrite) {
			return sendMessage({
				type: "saveObj",
				tableName: tableName,
				value: obj,
				overwrite: overwrite
			});
		},
		deleteObj = function(tableName, key) {
			return sendMessage({
				type: "deleteObj",
				tableName: tableName,
				key: key
			});
		},
		clearTable = function(tableName) {
			return sendMessage({
				type: "clearTable",
				tableName: tableName,
			});
		}
	
	this.reset = async function() {
		await clearTable(TABLE_USER);
		await clearTable(TABLE_ARTICLES);
		await clearTable(TABLE_POSTINGS);
		await clearTable(TABLE_POSITIVE_RATINGS);
		await clearTable(TABLE_NEGATIVE_RATINGS);
		await clearTable(TABLE_CATEGORIES);
		await clearTable(TABLE_CATEGORY_COUNTER);
		await clearTable(TABLE_USER);
		await clearTable(TABLE_USER);
		await this.saveCategory(MAIN_CATEGORY_NAME, MAIN_CATEGORY_COLOR);
	}
	
	this.getUser = function(userId) {
		return getObjByKey(TABLE_USER, false, parseInt(userId));
	};
	this.saveUser = async function(userId, name) {
		const user = await this.getUser(userId);
		return !user
			? saveObj(TABLE_USER, new User(userId, name))
			: Promise.resolve(user);
	};
	
	this.getArticle = function(articleId) {
		return getObjByKey(TABLE_ARTICLES, false, parseInt(articleId));
	};
	this.saveArticle = async function(articleId, timestamp) {
		const article = await this.getArticle(articleId);
		
		return !article
			? saveObj(TABLE_ARTICLES, new Article(articleId, timestamp, (await StoreDbFrontend.getMainCategory()).id))
			: Promise.resolve(article);
	}
	this.updateArticle = function(article) {
		if(article.hasOwnProperty("id")) {
			delete article.id;
		}
		return saveObj(TABLE_ARTICLES, article, true);
	};
	
	this.getPostingsForArticle = function(articleId) {
		return getAll(TABLE_POSTINGS, INDEX_POSTINGS_BY_ARTICLE, parseInt(articleId));
	};
	this.savePosting = async function(articleId, threadId, postingId, userId, timeString) {
		const posting = await getObjByKey(TABLE_POSTINGS, false, parseInt(postingId));
		return !posting
			? saveObj(TABLE_POSTINGS, new Posting(articleId, threadId, postingId, userId, timeString))
			: Promise.resolve(posting);
	};
	this.updatePosting = function(posting) {
		if(posting.hasOwnProperty("id")) {
			delete posting.id;
		}
		return saveObj(TABLE_POSTINGS, posting, true);
	};
	
	
	this.getPositiveRatingsForPosting = function(postingId) {
		return getAll(TABLE_POSITIVE_RATINGS, INDEX_POSITIVE_RATINGS_BY_POSTING, parseInt(postingId));
	};
	this.getNegativeRatingsForPosting = function(postingId) {
		return getAll(TABLE_NEGATIVE_RATINGS, INDEX_NEGATIVE_RATINGS_BY_POSTING, parseInt(postingId));
	};
	
	this.savePositiveRating = function(postingId, givenUserId, receivedUserId) {
		return saveObj(TABLE_POSITIVE_RATINGS, new Rating(postingId, givenUserId, receivedUserId));
	};
	this.saveNegativeRating = function(postingId, categoryId, givenUserId, receivedUserId) {
		return saveObj(TABLE_NEGATIVE_RATINGS, new Rating(postingId, categoryId, givenUserId, receivedUserId));
	};
	
	this.deletePositiveRating = function(id) {
		return deleteObj(TABLE_POSITIVE_RATINGS, parseInt(id));
	};
	this.deleteNegativeRating = function(id) {
		return deleteObj(TABLE_NEGATIVE_RATINGS, parseInt(id));
	};
	
	this.getAllCategories = function() {
		return getAll(TABLE_CATEGORIES);
	};
	let mainCategory = null;
	this.getMainCategory = async function() {
		if(mainCategory === null) {
			let main = await getObjByKey(TABLE_CATEGORIES, false, "lowerBound");
			if(main)
				mainCategory = main
			else
				mainCategory = await this.saveCategory(MAIN_CATEGORY_NAME, MAIN_CATEGORY_COLOR);
		}
		return mainCategory;
	};
	this.getCategory = function(id) {
		return getObjByKey(TABLE_CATEGORIES, false, parseInt(id));
	};
	this.saveCategory = function(name, color) {
		return saveObj(TABLE_CATEGORIES, new Category(name, color), true);
	};
	
	this.getCategoryCounter = function(categoryId, userId) {
		return getObjByKey(TABLE_CATEGORY_COUNTER, INDEX_CATEGORY_COUNTER_BY_CATEGORY_AND_USER, [parseInt(categoryId), parseInt(userId)]);
	};
	this.saveCategoryCounter = async function(categoryId, userId) {
		const categoryCounter = await this.getCategoryCounter(categoryId, userId);
		return !categoryCounter
			? saveObj(TABLE_CATEGORY_COUNTER, new CategoryCounter(categoryId, userId))
			: Promise.resolve(categoryCounter);
	};
	this.updateCategoryCounter = function(categoryCounter) {
		return saveObj(TABLE_CATEGORY_COUNTER, categoryCounter, true);
	};
	
	this.getJson = function() {
		return sendMessage({type: "getJson"});
	}
	this.saveJson = function(jsonString) {
		return sendMessage({type: "saveJson", value: jsonString});
	}
}