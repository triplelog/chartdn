var ws = new WebSocket('wss://chartdn.com:8080');
ws.onopen = function(evt) {
	var allcharts = document.querySelectorAll('chartdn-chart');
	for (var i=0;i<allcharts.length;i++){
		var jsonmessage = {'operation':'view','id':allcharts[i].getAttribute('src'),'loc':i,'style':allcharts[i].getAttribute('data-style')}
		ws.send(JSON.stringify(jsonmessage));
	}
}
ws.onmessage = function(evt){
	var dm = JSON.parse(evt.data);
	if (dm.operation == 'chart'){
		var chartJSON = dm.message;
		document.querySelectorAll('chartdn-chart')[parseInt(dm.loc)].makeChart(chartJSON);
	}
}

