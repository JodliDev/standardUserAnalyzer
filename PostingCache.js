function ExtendedPosting(user, posting, title, msg) {
	this.user = user;
	this.posting = posting;
	this.title = title;
	this.msg = msg;
}
const PostingCache = new function() {
	const store = {};
	
	this.add = function(user, posting, title, msg) {
		return store[posting.postingId] = new ExtendedPosting(user, posting, title, msg);
	}
	
	this.get = function(postingId) {
		let id = parseInt(postingId);
		return store.hasOwnProperty(id) ? store[id] : null;
	}
}
