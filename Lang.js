'use strict';

const Lang = new function() {
	let store = {
		article_category: "Artikel Kategorie",
		automatically_scan_article: "Scanne diesen Artikel automatisch",
		posting_categories: "Posting Kategorien",
		new_category_btn: "+ Neue Kategorie:",
		colon_cluster_size: "Cluster-Größe:",
		colon_responses: "Antworten:",
		colon_threads: "Threads:",
		colon_voted: "Gevoted:",
		colon_was_voted: "Wurde gevoted:",
		go_to_first_page: "Gehe zur ersten Seite",
		go_to_page_x: "Gehe zu Seite %d",
		info_load_rating: "Seite %d \nLade Rating %d/%d",
		prompt_choose_name_for_category: "Wähle einen Namen für die Kategorie.",
		prompt_choose_color_for_category: "Wähle einen css Farbcode (Hexadecimal ist möglich).",
		prompt_import_data: "Dadurch werden alle bisherigen Daten überschrieben / gelöscht. \nFortfahren?",
		timeline_closed: "Zeitleiste &#9205;",
		timeline_opened: "Zeitleiste &#9207;",
		minutes_abr: "min;"
	};
	this.get = function(key, ... replacers) {
		if(!store.hasOwnProperty(key))
			return key;
		
		let s = store[key];
		if(replacers.length) {
			for(let i=0, max=replacers.length; i<max; ++i) {
				let replace = replacers[i];
				let search;
				switch(typeof replace) {
					case "number":
						search = "%d";
						break;
					case "string":
						search = "%s";
						break;
				}
				s = s.replace(search, replacers[i]);
			}
			return s;
		}
		else
			return s;
	}
}