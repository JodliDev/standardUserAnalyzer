'use strict';

const RatingsHelper = new function() {
	let ratings = {};
	
	this.waitForRatings = async function(id) {
		return new Promise(function(resolve, reject) {
			ratings[id] = {
				reject: reject,
				resolve: resolve
			};
		});
	}
	this.continueRatings = function(id) {
		if(ratings.hasOwnProperty(id)) {
			ratings[id].resolve();
			delete ratings[id];
		}
	}
}