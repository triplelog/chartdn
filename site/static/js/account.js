hideAll();
chgTab('charts');
var n = {created:charts.created.length-1, forked:charts.forked.length-1, edited:charts.edited.length-1, viewed:charts.viewed.length-1};

var ws = new WebSocket('wss://chartdn.com:8080');
ws.onopen = function(evt) {
	var allcharts = document.querySelectorAll('chartdn-chart');
	for (var i=0;i<allcharts.length;i++){
		allcharts[i].setAttribute('data-loc',i);
		var jsonmessage = {'operation':'view','id':allcharts[i].getAttribute('src'),'loc':i,'style':allcharts[i].getAttribute('data-style')}
		ws.send(JSON.stringify(jsonmessage));
	}
}
ws.onmessage = function(evt){
	var dm = JSON.parse(evt.data);
	if (dm.operation == 'chart'){
		var chartJSON = dm.message;
		var el = document.querySelector('chartdn-chart[data-loc="'+parseInt(dm.loc)+'"]');
		if (el){
			el.makeChart(chartJSON);
		}
	}
	else if (dm.operation == 'friend'){
		var newDiv = document.createElement('div');
		var newA = document.createElement('a');
		newA.setAttribute('href','../user/'+dm.message);
		newA.textContent = dm.message;
		newDiv.appendChild(newA);
		document.getElementById('friendList').appendChild(newDiv);
	}
}


function hideAll() {
	var tabids = ['charts','favorites','settings','friends'];
	for (var i=0;i<tabids.length;i++){
		if (document.getElementById(tabids[i]) && document.getElementById('tab'+tabids[i])) {
			document.getElementById(tabids[i]).style.display = 'none';
			document.getElementById('tab'+tabids[i]).classList.remove('pure-menu-selected');
		}
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
	}
	else if (chg == -2){
		n[type]=0;
	}
	else if (chg == 1){
		n[type]++;
		if (n[type]>charts[type].length-1){
			n[type]=charts[type].length-1;
		}
	}
	else if (chg == 2){
		n[type] = charts[type].length-1;
	}
	var el = document.getElementById(type+'Chart');
	el.setAttribute('src',charts[type][n[type]]);
	var ell = document.getElementById(type+'Link');
	ell.setAttribute('href','../charts/'+charts[type][n[type]]);
	ell.textContent = charts[type][n[type]];
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

function addFriend() {
	var friendEl = document.getElementById('newFriend');
	if (friendEl && friendEl.value && friendEl.value != ''){
		var friend = friendEl.value;
		var jsonmessage = {'operation':'friend','username':username,'message':friend};
		ws.send(JSON.stringify(jsonmessage));
		
	}
	
}




