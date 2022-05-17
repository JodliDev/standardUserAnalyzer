
async function exportDb() {
	document.getElementById("json").value = await StoreDbFrontend.getJson();
}
async function importDb() {
	let json = document.getElementById("json").value;
	if(!json || !window.confirm(Lang.get("prompt_import_data")))
		return;
	await StoreDbFrontend.saveJson(json);
	alert("Success");
}
document.getElementById("exportBtn").addEventListener("click", exportDb);
document.getElementById("importBtn").addEventListener("click", importDb);