'use strict';
function User(userId, name) {
	this.userId = parseInt(userId);
	this.name = name;
}
function Article(articleId, timestamp, categoryId) {
	this.articleId = parseInt(articleId);
	this.timestamp = timestamp;
	this.categories = [parseInt(categoryId)];
}
function Posting(articleId, parentId, responseLevel, postingId, userId, timeString) {
	this.articleId = parseInt(articleId);
	this.parentId = parentId ? parseInt(parentId) : "";
	this.responseLevel = parseInt(responseLevel);
	this.postingId = parseInt(postingId);
	this.userId = parseInt(userId);
	this.timestamp = Formatter.localeDateStringToTimeStamp(timeString);
	this.isThread = parentId === "";
	this.categories = [];
}
function Rating(postingId, givenUserId, receivedUserId) {
	//id
	this.postingId = parseInt(postingId);
	this.givenUserId = parseInt(givenUserId);
	this.receivedUserId = parseInt(receivedUserId);
}
function Category(name, color) {
	//id
	this.name = name;
	this.color = color;
}
function CategoryCounter(categoryId, userId) {
	//id
	this.categoryId = parseInt(categoryId);
	this.userId = parseInt(userId);
	this.threadCount = 0;
	this.responseCount = 0;
	this.givenPositiveRatingCount = 0;
	this.givenNegativeRatingCount = 0;
	this.receivedPositiveRatingCount = 0;
	this.receivedNegativeRatingCount = 0;
}