'use strict';

const Lang = new function() {
	let store = {
		article_category: "Artikel Kategorie",
		automate_description: "Besucht automatisch sämtliche Seiten dieses Artikels und scannt sämtliche Postings sowie Ratings. Achtung: Abhängig von der Anzahl der Postings, dauert das eine Weile.",
		deleted_profile: "Gelöschtes Profil",
		frequencies: "Häufigkeiten",
		posting_scanned_state: "Gescannte Postings: %d / %d",
		posting_categories: "Posting Kategorien",
		new_category_btn: "Neue Kategorie",
		cancel: "Abbrechen",
		colon_cluster_size: "Cluster-Größe:",
		colon_filter_user: "Filtere User:",
		colon_responses: "Antworten:",
		colon_sort_by: "Sortiere nach:",
		colon_threads: "Threads:",
		colon_voted: "Gevoted:",
		colon_was_voted: "Wurde gevoted:",
		go_to_first_page: "Gehe zur ersten Seite",
		go_to_page_x_of_x: "Gehe zu Seite %d/%d",
		info_load_rating: "Seite %d/%d \nLade Rating %d/%d",
		only_showing_x_postings: "Nicht vollständig gescannt! Es werden nur %d von %d Postings gezeigt.",
		posting_does_not_exist: "Posting existiert nicht.",
		prompt_choose_name_for_category: "Wähle einen Namen für die Kategorie.",
		prompt_choose_color_for_category: "Wähle einen css Farbcode (Hexadecimal ist möglich).",
		responses: "Antworten",
		scan_article: "Scanne Artikel",
		skip_ratings: "Überspringe Ratings",
		start_scanning: "Starte Scan-Vorgang",
		timeline_btn: "Zeitleiste",
		threads: "Threads",
		minutes_abr: "min"
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