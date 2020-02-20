hideAll();
chgTab('charts');
function hideAll() {
	var tabids = ['charts','favorites','settings','friends'];
	for (var i=0;i<tabids.length;i++){
		document.getElementById(tabids[i]).style.display = 'none';
		document.getElementById('tab'+tabids[i]).classList.remove('pure-menu-selected');
	}
}
function chgTab(tabid){
	hideAll();
	document.getElementById(tabid).style.display = 'block';
	document.getElementById('tab'+tabid).classList.add('pure-menu-selected');
}