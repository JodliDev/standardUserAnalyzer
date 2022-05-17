function getRuntime() {
	return (typeof browser === "undefined" ? chrome : browser).runtime;
}

function sendMessage(data) {
	if(typeof browser === "undefined") {
		return new Promise(function(resolve, reject) {
			chrome.runtime.sendMessage(data, function(response) {
				resolve(response);
			});
		})
	}
	else
		return browser.runtime.sendMessage(data);
}