'use strict';

const StoreHelper = {
	articleIsCategory: function(article, category) {
		return article.categories.includes(category.id);
	},
	postingIsCategory: function(posting, category) {
		return posting.categories.includes(category.id);
	},
	
	storePosting: async function(article, parentId, responseLevel, postingId, userId, timeString) {
		const posting = await StoreDbFrontend.savePosting(article.articleId, parentId, responseLevel, postingId, userId, timeString);
		
		for(const categoryId of article.categories) {
			await this.addPostingToCategory(posting, categoryId);
		}
		return posting;
	},
	
	doRatingsForPosting: async function(posting, positiveRatingsMap, negativeRatingsMap) {
		const postingId = posting.postingId;
		const receivedUserId = posting.userId;
		
		const removedPositiveRatingUserIds = [];
		const removedNegativeRatingUserIds = [];
		let removedPositiveRatingsCount = 0;
		let removedNegativeRatingsCount = 0;
		
		//delete not existing ratings:
		const positiveRatings = await StoreDbFrontend.getPositiveRatingsForPosting(postingId);
		const negativeRatings = await StoreDbFrontend.getNegativeRatingsForPosting(postingId);
		
		for(const rating of positiveRatings) {
			const givenUserId = rating.givenUserId;
			if(positiveRatingsMap.hasOwnProperty(givenUserId)) {
				delete positiveRatingsMap[givenUserId];
			}
			else {
				await StoreDbFrontend.deletePositiveRating(rating.id);
				++removedPositiveRatingsCount;
				removedPositiveRatingUserIds.push(givenUserId);
			}
		}
		for(const rating of negativeRatings) {
			const givenUserId = rating.givenUserId;
			if(negativeRatingsMap.hasOwnProperty(givenUserId)) {
				delete negativeRatingsMap[givenUserId];
			}
			else {
				await StoreDbFrontend.deleteNegativeRating(rating.id);
				++removedNegativeRatingsCount;
				removedNegativeRatingUserIds.push(givenUserId);
			}
		}
		
		
		//add remaining ratings
		for(const userId in positiveRatingsMap) {
			if(!positiveRatingsMap.hasOwnProperty(userId))
				continue;
			await StoreDbFrontend.savePositiveRating(posting.postingId, userId, receivedUserId);
		}
		for(const userId in negativeRatingsMap) {
			if(!negativeRatingsMap.hasOwnProperty(userId))
				continue;
			await StoreDbFrontend.saveNegativeRating(posting.postingId, userId, receivedUserId);
		}
		
		
		//correct category Counter:
		const categories = await this.getPostingCategories(posting);
		
		for(const categoryId of categories) {
			let categoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, receivedUserId);
			
			if(categoryCounter) {
				categoryCounter.receivedPositiveRatingCount -= removedPositiveRatingsCount;
				categoryCounter.receivedNegativeRatingCount -= removedNegativeRatingsCount;
				
				//correct removed ratings
				for(const givenUserId of removedPositiveRatingUserIds) {
					const givenCategoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, givenUserId);
					--categoryCounter.givenPositiveRatingCount;
					await StoreDbFrontend.updateCategoryCounter(givenCategoryCounter);
				}
				for(const givenUserId of removedNegativeRatingUserIds) {
					const givenCategoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, givenUserId);
					--categoryCounter.givenNegativeRatingCount;
					await StoreDbFrontend.updateCategoryCounter(givenCategoryCounter);
				}
			}
			else {
				categoryCounter = await StoreDbFrontend.saveCategoryCounter(categoryId, receivedUserId);
			}
			
			//add new ratings:
			for(const givenUserId in positiveRatingsMap) {
				++categoryCounter.receivedPositiveRatingCount;
				
				const givenUserCategoryCounter = await StoreDbFrontend.saveCategoryCounter(categoryId, givenUserId);
				++givenUserCategoryCounter.givenPositiveRatingCount;
				await StoreDbFrontend.updateCategoryCounter(givenUserCategoryCounter);
			}
			for(const givenUserId in negativeRatingsMap) {
				++categoryCounter.receivedNegativeRatingCount;
				
				const givenUserCategoryCounter = await StoreDbFrontend.saveCategoryCounter(categoryId, givenUserId);
				++givenUserCategoryCounter.givenNegativeRatingCount;
				await StoreDbFrontend.updateCategoryCounter(givenUserCategoryCounter);
			}
			
			await StoreDbFrontend.updateCategoryCounter(categoryCounter);
		}
	},
	
	getPostingCategories: async function(posting) {
		return posting.categories;
	},
	
	addArticleToCategory: async function(article, categoryId) {
		if(article.categories.includes(categoryId))
			return;
		article.categories.push(categoryId);
		await StoreDbFrontend.updateArticle(article);
		
		const postings = await StoreDbFrontend.getPostingsForArticle(article.articleId);
		for(const posting of postings) {
			await this.addPostingToCategory(posting, categoryId);
		}
	},
	removeArticleFromCategory: async function(article, categoryId) {
		const index = article.categories.indexOf(categoryId);
		if(index !== -1) {
			article.categories.splice(index, 1);
		}
		else
			return;
		await StoreDbFrontend.updateArticle(article);
		
		const postings = await StoreDbFrontend.getPostingsForArticle(article.articleId);
		for(const posting of postings) {
			await this.removePostingFromCategory(posting, categoryId);
		}
	},
	
	addPostingToCategory: async function(posting, categoryId) {
		if(posting.categories.includes(categoryId))
			return;
		posting.categories.push(categoryId);
		await StoreDbFrontend.updatePosting(posting);
		
		const categoryCounter = await StoreDbFrontend.saveCategoryCounter(categoryId, posting.userId);
		if(posting.isThread)
			++categoryCounter.threadCount;
		else
			++categoryCounter.responseCount;
		
		await this.addExistingRatingsToCategoryCounter(posting, categoryCounter, +1);
	},
	removePostingFromCategory: async function(posting, categoryId) {
		const index = posting.categories.indexOf(categoryId);
		if(index !== -1) {
			posting.categories.splice(index, 1);
		}
		else
			return;
		await StoreDbFrontend.updatePosting(posting);
		
		const categoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, posting.userId);
		if(posting.isThread)
			--categoryCounter.threadCount;
		else
			--categoryCounter.responseCount;
		
		await this.addExistingRatingsToCategoryCounter(posting, categoryCounter, -1);
	},
	addExistingRatingsToCategoryCounter: async function(posting, categoryCounter, value) {
		const positiveRatings = await StoreDbFrontend.getPositiveRatingsForPosting(posting.postingId);
		const negativeRatings = await StoreDbFrontend.getNegativeRatingsForPosting(posting.postingId);
		const categoryId = categoryCounter.categoryId;
		
		for(const rating of positiveRatings) {
			categoryCounter.receivedPositiveRatingCount += value;
			
			const givenUserCategoryCounter = await StoreDbFrontend.saveCategoryCounter(categoryId, rating.givenUserId);
			givenUserCategoryCounter.givenPositiveRatingCount += value;
			await StoreDbFrontend.updateCategoryCounter(givenUserCategoryCounter);
		}
		for(const rating of negativeRatings) {
			categoryCounter.receivedNegativeRatingCount += value;
			
			const givenUserCategoryCounter = await StoreDbFrontend.saveCategoryCounter(categoryId, rating.givenUserId);
			givenUserCategoryCounter.givenNegativeRatingCount += value;
			await StoreDbFrontend.updateCategoryCounter(givenUserCategoryCounter);
		}
		
		await StoreDbFrontend.updateCategoryCounter(categoryCounter);
	},
	
	getThreadCount: async function(userId, categoryId) {
		const categoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, userId);
		return categoryCounter ? categoryCounter.threadCount : 0;
	},
	getResponsesCount: async function(userId, categoryId) {
		const categoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, userId);
		return categoryCounter ? categoryCounter.responseCount : 0;
	},
	
	getGivenPositiveRatingCount: async function(userId, categoryId) {
		const categoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, userId);
		return categoryCounter ? categoryCounter.givenPositiveRatingCount : 0;
	},
	getGivenNegativeRatingsCount: async function(userId, categoryId) {
		const categoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, userId);
		return categoryCounter ? categoryCounter.givenNegativeRatingCount : 0;
	},
	
	getReceivedPositiveRatingCount: async function(userId, categoryId) {
		const categoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, userId);
		return categoryCounter ? categoryCounter.receivedPositiveRatingCount : 0;
	},
	getReceivedNegativeRatingsCount: async function(userId, categoryId) {
		const categoryCounter = await StoreDbFrontend.getCategoryCounter(categoryId, userId);
		return categoryCounter ? categoryCounter.receivedNegativeRatingCount : 0;
	},
};