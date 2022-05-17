'use strict';

function Loader() {
	let wasClosed = false;
	
	
	this.setContent = function(s) {
		content.innerText = s;
	};
	this.isClosed = function() {
		return wasClosed;
	};
	this.close = function() {
		wasClosed = true;
		el.parentNode.removeChild(el);
	};
	
	
	const el = document.createElement("div");
	el.style.cssText = "position: fixed; top: 0; bottom: 0; left: 0; right: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: #00000099; z-index: 1000;";
	
	
	const content = document.createElement("div");
	content.style.cssText = "width: 300px; height: 100px; background-color: #ffffff33; color: white; text-align: center;";
	el.appendChild(content);
	
	const cancel = document.createElement("div");
	cancel.style.cssText = "cursor: pointer; color: white; font-weight: bold;";
	cancel.innerText = "Cancel";
	cancel.onclick = this.close;
	el.appendChild(cancel);
	
	document.body.appendChild(el);
}