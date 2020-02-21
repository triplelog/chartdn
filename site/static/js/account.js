hideAll();
chgTab('charts');
var n = {created:charts.created.length-1};
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

function chgChart(type,chg){
	if (chg == -1){
		n[type]--;
		if (n[type]<0){
			n[type]=0;
		}
		var el = document.getElementById(type+'Chart');
		el.setAttribute('src',charts[type][n[type]]);
	}
}