
async function exportDb() {
	document.getElementById("json").value = await StoreDbFrontend.getJson();
}
async function importDb() {
	let json = document.getElementById("json").value;
	if(!json)
		return;
	await StoreDbFrontend.saveJson(json);
	document.getElementById("json").value = "";
}
document.getElementById("exportBtn").addEventListener("click", exportDb);
document.getElementById("importBtn").addEventListener("click", importDb);