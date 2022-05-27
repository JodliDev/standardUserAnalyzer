try {
	importScripts("db/StoreDbDefinitions.js", "db/StoreDbBackend.js", "libs/indexedDbImportExport.js");
}
catch (e) {
	console.error(e);
}