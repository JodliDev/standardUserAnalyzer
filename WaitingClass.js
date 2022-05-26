'use strict';

class WaitingClass {
	store = {};
	
	finish(id) {
		id = id || "noName";
		if(this.store.hasOwnProperty(id)) {
			const entry = this.store[id];
			window.clearTimeout(this.store[id].timeoutId);
			delete this.store[id];
		}
	}
	
	async wait(id) {
		id = id || "noName";
		const self = this;
		
		const timeoutId = window.setTimeout(this.fail.bind(this, id), 5000);
		
		return new Promise(function(resolve, reject) {
			self.store[id] = {
				reject: reject,
				resolve: resolve,
				timeoutId: timeoutId
			};
		});
	}
	continue(id) {
		id = id || "noName";
		if(this.store.hasOwnProperty(id)) {
			this.store[id].resolve();
			this.finish(id);
		}
	}
	fail(id) {
		id = id || "noName";
		if(this.store.hasOwnProperty(id)) {
			this.store[id].reject();
			this.finish(id);
		}
	}
}