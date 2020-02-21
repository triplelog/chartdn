hideAll();
chgTab('charts');
var n = {created:charts.created.length-1, forked:charts.forked.length-1};
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
	else if (chg == -2){
		n[type]=0;
		var el = document.getElementById(type+'Chart');
		el.setAttribute('src',charts[type][n[type]]);
	}
	else if (chg == 1){
		n[type]++;
		if (n[type]>charts[type].length-1){
			n[type]=charts[type].length-1;
		}
		var el = document.getElementById(type+'Chart');
		el.setAttribute('src',charts[type][n[type]]);
	}
	else if (chg == 2){
		n[type] = charts[type].length-1;
		var el = document.getElementById(type+'Chart');
		el.setAttribute('src',charts[type][n[type]]);
	}
}
minimizedBoxes = {};
minimizedBoxes.created = 'half';
minimizedBoxes.forked = 'half';
minimizedBoxes.edited = 'half';
minimizedBoxes.viewed = 'half';
function minimizeBox(type,full=false){
	var el = document.getElementById(type+'Box');
	var myStyle = el.querySelector('chartdn-chart').getAttribute('data-style');
	var loc = el.querySelector('chartdn-chart').getAttribute('data-loc');
	var chartid = el.querySelector('chartdn-chart').getAttribute('src');
	if (full){
		el.classList.add('pure-u-1-1');
		el.classList.remove('pure-u-1-2');
		el.style.display = 'block';
		minimizedBoxes[type] = 'full';
		var jsonmessage = {'operation':'view','id':chartid,'loc':loc,'style':myStyle};
		ws.send(JSON.stringify(jsonmessage));
		var el2 = document.getElementById(type+'None');
		el2.style.display = 'none';
	}
	else if (minimizedBoxes[type] == 'full') {
		el.classList.add('pure-u-1-2');
		el.classList.remove('pure-u-1-1');
		el.style.display = 'block';
		var jsonmessage = {'operation':'view','id':chartid,'loc':loc,'style':myStyle}
		ws.send(JSON.stringify(jsonmessage));
		minimizedBoxes[type] = 'half';
	}
	else if (minimizedBoxes[type] == 'half') {
		el.style.display = 'none';
		var el2 = document.getElementById(type+'None');
		el2.style.display = 'block';
		minimizedBoxes[type] = 'none';
	}
	else if (minimizedBoxes[type] == 'none') {
		el.classList.add('pure-u-1-2');
		el.classList.remove('pure-u-1-1');
		el.style.display = 'block';
		var jsonmessage = {'operation':'view','id':chartid,'loc':loc,'style':myStyle}
		ws.send(JSON.stringify(jsonmessage));
		minimizedBoxes[type] = 'half';
		var el2 = document.getElementById(type+'None');
		el2.style.display = 'none';
	}
	
}




