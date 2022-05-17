'use strict';

const StoreDbBackend = new function() {
	const TABLE_USER = "users",
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
	
	let db = null;
	
	const handleRequestError = function(e) {
		console.error(e);
	};
	
	let init = function() {
		if(db != null)
			return Promise.resolve();
		
		return new Promise(function(resolve, reject) {
			const request = indexedDB.open("storeDB", 3);
			
			request.onerror = function(e) {
				handleRequestError(e);
				reject();
			};
			request.onupgradeneeded = function(event) {
				db = event.target.result;
				db.createObjectStore(TABLE_USER, {keyPath: "userId"});


				db.createObjectStore(TABLE_ARTICLES, {keyPath: "articleId"});

				const postingsStore = db.createObjectStore(TABLE_POSTINGS, {keyPath: "postingId"});
				postingsStore.createIndex(INDEX_POSTINGS_BY_ARTICLE, "articleId",  {unique: false});

				const positiveRatingsStore = db.createObjectStore(TABLE_POSITIVE_RATINGS, {keyPath: "id", autoIncrement: true});
				positiveRatingsStore.createIndex(INDEX_POSITIVE_RATINGS_BY_POSTING, "postingId",  {unique: false});

				const negativeRatingsStore = db.createObjectStore(TABLE_NEGATIVE_RATINGS, {keyPath: "id", autoIncrement: true});
				negativeRatingsStore.createIndex(INDEX_NEGATIVE_RATINGS_BY_POSTING, "postingId",  {unique: false});

				const categoryCounterStore = db.createObjectStore(TABLE_CATEGORY_COUNTER, {keyPath: "id", autoIncrement: true});
				categoryCounterStore.createIndex(INDEX_CATEGORY_COUNTER_BY_CATEGORY_AND_USER, ["categoryId", "userId"],  {unique: false});

				db.createObjectStore(TABLE_CATEGORIES, {keyPath: "id", autoIncrement: true});
			};
			request.onsuccess = async function(event) {
				db = event.target.result;
				db.onversionchange = function() {
					db.close();
				};
				
				resolve();
			};
		});
	}
	
	
	this.getAll = async function(tableName, indexName, indexValue) {
		await init();
		return new Promise(function(resolve, reject) {
			const transaction = db.transaction(tableName);
			const store = transaction.objectStore(tableName);
			
			const request = indexName
				? store.index(indexName).getAll(indexValue)
				: store.getAll();
			
			request.onerror = function(e) {
				handleRequestError(e);
				reject();
			};
			request.onsuccess = function() {
				resolve(request.result);
			};
		});
	};
	this.getObjByKey = async function(tableName, indexName, key) {
		await init();
		return new Promise(function(resolve, reject) {
			if(key === "lowerBound")
				key = IDBKeyRange.lowerBound(0, true);
			
			const transaction = db.transaction([tableName], "readonly");
			const store = transaction.objectStore(tableName);
			const request = indexName
				? store.index(indexName).get(key)
				: store.get(key);
			
			request.onerror = function(e) {
				handleRequestError(e);
				reject();
			};
			request.onsuccess = function(event) {
				resolve(request.result);
			};
		});
	};
	this.saveObj = async function(tableName, obj, overwrite) {
		await init();
		return new Promise(function(resolve, reject) {
			let objStore = db.transaction([tableName], "readwrite").objectStore(tableName);
			const request = overwrite ? objStore.put(obj) : objStore.add(obj);
			
			request.onerror = function(e) {
				handleRequestError(e);
				reject();
			};
			request.onsuccess = function(event) {
				obj.id = request.result;
				resolve(obj);
			};
		});
	};
	this.deleteObj = async function(tableName, key) {
		await init();
		return new Promise(function(resolve, reject) {
			let objStore = db.transaction([tableName], "readwrite").objectStore(tableName);
			const request = objStore.delete(key);
			
			request.onerror = function(e) {
				handleRequestError(e);
				reject();
			};
			request.onsuccess = function(event) {
				resolve(request.result);
			};
		});
	};
	this.clearTable = async function(tableName) {
		await init();
		return new Promise(function(resolve, reject) {
			let objStore = db.transaction([tableName], "readwrite").objectStore(tableName);
			const request = objStore.clear();
			
			request.onerror = function(e) {
				handleRequestError(e);
				reject();
			};
			request.onsuccess = function(event) {
				resolve(request.result);
			};
		});
	};
	this.getIndexCount = async function(tableName, indexName, key) {
		await init();
		return new Promise(function(resolve, reject) {
			const transaction = db.transaction(tableName);
			const store = transaction.objectStore(tableName);
			const index = store.index(indexName);
			const request = index.count(key)
			
			request.onerror = function(e) {
				handleRequestError(e);
				reject();
			};
			request.onsuccess = function(event) {
				resolve(request.result);
			};
		});
	};
	
	this.getNativeDb = async function() {
		await init();
		return db;
	}
}


getRuntime().onMessage.addListener(function({type, tableName, indexName, key, value, overwrite}, sender, sendResponse ) {
	let promise;
	switch(type) {
		case "getAll":
			promise = StoreDbBackend.getAll(tableName, indexName, value);
			break;
		case "getObjByKey":
			promise = StoreDbBackend.getObjByKey(tableName, indexName, key);
			break;
		case "saveObj":
			promise = StoreDbBackend.saveObj(tableName, value, overwrite);
			break;
		case "deleteObj":
			promise = StoreDbBackend.deleteObj(tableName, key);
			break;
		case "clearTable":
			promise = StoreDbBackend.clearTable(tableName);
			break;
		case "getJson":
			promise = new Promise(async function(resolve, reject) {
				exportToJsonString(await StoreDbBackend.getNativeDb(), function(error, json) {
					if(error)
						reject(error);
					else
						resolve(json);
				});
			});
			
			break;
		case "saveJson":
			promise = new Promise(async function(resolve, reject) {
				let db = await StoreDbBackend.getNativeDb();
				clearDatabase(db, function(clearError) {
					if(clearError) {
						reject(clearError);
						return;
					}
					importFromJsonString(db, value, function(error) {
						if(error)
							reject(error);
						else
							resolve();
					});
				});
			});
			
			break;
	}
	
	promise.then(function(returnData) {
		sendResponse(returnData);
	});
	return true;
});
