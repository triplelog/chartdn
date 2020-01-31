hideAll();
function hideAll() {
	document.getElementById('created').style.display = 'none';
	document.getElementById('favorites').style.display = 'none';
	document.getElementById('friends').style.display = 'none';
	document.getElementById('settings').style.display = 'none';
}
function chgTab(tabid){
	hideAll();
	document.getElementById(tabid).style.display = 'block';
}