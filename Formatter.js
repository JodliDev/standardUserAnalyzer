'use strict';

const Formatter = new function() {
	const tempDate = new Date();
	
	//create a map for month names to integer:
	const monthsMap = {};
	tempDate.setDate(1);
	for(let i=0; i<12; ++i) {
		tempDate.setMonth(i);
		monthsMap[tempDate.toLocaleString("default", { month: "long" })] = i;
	}
	
	//create a map for the locale format (that is used at standard.at):
	//Thanks to: https://stackoverflow.com/questions/43368659/how-to-determine-users-locale-date-format-using-javascript-format-is-dd-mm-or-m
	const formatArray = new Intl.DateTimeFormat("default",  {month:"long", day:"numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"}).formatToParts(tempDate);
	
	const formatMap = {};
	
	let formatString = "";
	let count = 0;
	for(const obj of formatArray) {
		switch(obj.type) {
			case "second":
			case "minute":
			case "hour":
			case "day":
			case "month":
			case "year":
				formatString += isNaN(obj.value) ? "(.+)" : "(\\d+)";
				break;
			default:
				formatString += obj.value;
				continue;
		}
		++count;
		formatMap[obj.type] = count;
	}
	
	this.localeDateStringToTimeStamp = function(dateString) {
		const matches = dateString.match(formatString);
		const date = new Date(
			matches[formatMap.year],
			monthsMap[matches[formatMap.month]],
			matches[formatMap.day],
			matches[formatMap.hour],
			matches[formatMap.minute],
			matches[formatMap.second]
		);
		
		return date.getTime();
	};
	
	this.timeStampToLocaleDateString = function(timeStamp) {
		const date = new Date(timeStamp);
		const list = [];
		list[formatMap.second] = {search: "(\\d+)", replace: String(date.getSeconds()).padStart(2, '0')};
		list[formatMap.minute] = {search: "(\\d+)", replace: String(date.getMinutes()).padStart(2, '0')};
		list[formatMap.hour] = {search: "(\\d+)", replace: String(date.getHours()).padStart(2, '0')};
		list[formatMap.day] = {search: "(\\d+)", replace: date.getDate()};
		list[formatMap.month] = {search: "(.+)", replace: date.toLocaleString("default", { month: "long" })};
		list[formatMap.year] = {search: "(\\d+)", replace: date.getFullYear()};
		
		let r = formatString
		for(const line of list) {
			if(!line)
				continue;
			r = r.replace(line.search, line.replace);
		}
		return r;
	}
};