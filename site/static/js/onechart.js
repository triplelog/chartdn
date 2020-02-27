var ws = new WebSocket('wss://chartdn.com:8080');
ws.onopen = function(evt) {
	var jsonmessage = {'operation':'qr'};
	ws.send(JSON.stringify(jsonmessage));
	
	var jsonmessage = {'operation':'key','message':tkey};
	jsonmessage['chartid']=chartid;
	ws.send(JSON.stringify(jsonmessage));
	
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
		//var chartJSON = dm.message;
		
		var strData = atob(dm.message);
		var charData = strData.split('').map(function(x){return x.charCodeAt(0);});
		var binData = new Uint8Array(charData);
		var chartJSON = pako.inflate(binData,{to:'string'});
		console.log(chartJSON);
		console.log(atob(chartJSON));
		var el = document.querySelector('chartdn-chart[data-loc="'+parseInt(dm.loc)+'"]');
		if (el){
			el.makeChart(chartJSON);
		}
	}
}

