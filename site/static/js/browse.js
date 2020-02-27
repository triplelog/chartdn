var ws = new WebSocket('wss://chartdn.com:8080');
ws.onopen = function(evt) {
	var jsonmessage = {'operation':'key','message':tkey};
	ws.send(JSON.stringify(jsonmessage));
	
	var allcharts = document.querySelectorAll('chartdn-chart');
	for (var i=0;i<allcharts.length;i++){
		allcharts[i].setAttribute('data-loc',i);
		var jsonmessage = {'operation':'view','id':allcharts[i].getAttribute('src'),'loc':i,'style':allcharts[i].getAttribute('data-style')}
		ws.send(JSON.stringify(jsonmessage));
	}
	
}
ws.onmessage = function(evt){
	var dm;
	if (evt.data[0]=='{'){
		dm = JSON.parse(evt.data);
	}
	else {
		var strData = atob(evt.data);
		var charData = strData.split('').map(function(x){return x.charCodeAt(0);});
		var binData = new Uint8Array(charData);
		var newData = pako.inflate(binData,{to:'string'});
		dm = JSON.parse(newData);
	}
	if (dm.operation == 'chart'){
		var chartJSON = dm.message;
		var el = document.querySelector('chartdn-chart[data-loc="'+parseInt(dm.loc)+'"]');
		if (el){
			el.makeChart(chartJSON);
		}
	}
}

document.getElementById('submitFilters').addEventListener('click',submitFilters);
function submitFilters() {
	var tags = document.getElementById('tags').value.toLowerCase().replace(/,\s/g,',').replace(/\s/g,'_');
	var creators = document.getElementById('creators').value.toLowerCase().replace(/,\s/g,',').replace(/\s/g,'_');
	var url = "../browse"
	if (creators.length > 0){
		url += '?creators='+creators;
		if (tags.length > 0){
			url += '&tags='+tags;
		}
		window.location.replace(url);
	}
	else if (tags.length > 0){
		url += '?tags='+tags;
		window.location.replace(url);
	}
	else {
		window.location.replace(url);
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




