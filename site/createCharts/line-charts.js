
exports.createPlotly = function(data,options) {
	var datasets = [];
	for (var i=0;i<options['yColumns'].length;i++){
		datasets.push({'x':data['bycol'][options['xColumn']], 'y':data['bycol'][options['yColumns'][i]], 'mode': 'lines+markers'});
	}

	if (!options.title) {options['title']=''}
	if (!options.xaxis) {options['xaxis']=''}
	if (!options.yaxis) {options['yaxis']=''}
	var baseJS = `
	<script>
	document.getElementById('plotlyDiv').style.display = 'block';

	var data = `+JSON.stringify(datasets)+`;

	var layout = {
	  `+options.title+`
	  `+options.xaxis+`
	  `+options.yaxis+`
  
	};

	Plotly.newPlot('plotlyDiv', data, layout);
	</script>
	`;
	return baseJS;

}

function createJSdatasets(data,options) {
	var datasets = [];
	if (!options['yColumns']){return [];}
	if (!options['xColumn']){return [];}
	var xColumn = 0;
	var yColumns = [];
	if (!isNaN(parseInt(options.xColumn))){ xColumn = parseInt(options.xColumn);}
	var yCols = options.yColumns.split(',');
	for (var i=0;i<yCols.length;i++){
		if (!isNaN(parseInt(yCols[i]))){ yColumns.push(parseInt(yCols[i]));}
	}
	if(yColumns.length==0){
		yColumns.push(1);
	}
	for (var i=0;i<yColumns.length;i++){
		var newdataset = {'label':'Label','data':[],'fill':false};
		for (var ii=0;ii<data['bycol'][yColumns[i]].length;ii++){
			newdataset['data'].push({'x':data['bycol'][xColumn][ii], 'y':data['bycol'][yColumns[i]][ii]});
		}
		if (options.lineColor) {newdataset['borderColor']=lineColor}
		if (options.dotColor) {newdataset['backgroundColor']=dotColor}
			
		datasets.push(newdataset);
	}
	return datasets;
}
exports.createChartjs = function(data,options) {
	
	var datasets = createJSdatasets(data,options);
	var chartjsOptions = {'datasets':datasets,'title':{},'xTicks':{},'yTicks':{}};
	if (options.title != '' && options.title != 'notitle') {chartjsOptions['title'] = {display: true, text: options.title};}
	if (options.stepSizeX != '' && options.stepSizeX != 'default') {chartjsOptions['xTicks'] = {'stepSize': options.stepSizeX };}
	if (options.stepSizeY != '' && options.stepSizeY != 'default') {chartjsOptions['yTicks'] = {'stepSize': options.stepSizeY };}
	//chartjsOptions['yTicks']['beginAtZero'] = true;
	//Check if step sizes are numbers?
	var chartJSON = {
		type: 'line',
		data: {
			datasets: chartjsOptions['datasets'],
		},
		options: {
			scales: {
				yAxes: [{
					ticks: chartjsOptions['yTicks'],
				}],
				xAxes: [{
					type: 'linear',
					position: 'bottom',
					ticks: chartjsOptions['xTicks'],
				}]
			},
			title: chartjsOptions['title'],

		}
	};
	return chartJSON;
}


exports.createXkcd = function(data,options) {
	var datasets = [];
	if (!options['yColumns']){return {};}
	if (!options['xColumn']){return {};}
	var xColumn = 0;
	var yColumns = [];
	if (!isNaN(parseInt(options.xColumn))){ xColumn = parseInt(options.xColumn);}
	var yCols = options.yColumns.split(',');
	for (var i=0;i<yCols.length;i++){
		if (!isNaN(parseInt(yCols[i]))){ yColumns.push(parseInt(yCols[i]));}
	}
	if(yColumns.length==0){
		yColumns.push(1);
	}
	
	for (var i=0;i<options['yColumns'].length;i++){
		datasets.push({'label': 'Y'+i, 'data':data['bycol'][yColumns[i]]});
	}
	
	var labels = [];
	for (var i=0;i<data['bycol'][xColumn].length;i++){
		labels.push(''+data['bycol'][xColumn][i]);
	}
	
	
	
	var chartJSON = {
	  xLabel: 'Month', // optional
	  yLabel: '$ Dollars', // optional
	  data: {
		labels: labels,
		datasets: datasets,
	  },
	  options: { // optional
		legendPosition: 'chartXkcd.config.positionType.upLeft'
	  }
	};
	console.log(datasets[2]);
	if (options.title != '' && options.title != 'notitle') {chartJSON['title']=options.title;}
	/*if (!options.tickCountY) {options['tickCountY']=''}
	if (!options.tickCountX) {options['tickCountX']=''}*/
	return chartJSON;

}

/*
exports.createXkcd = function(data,options) {
	var datasets = [];
	for (var i=0;i<options['yColumns'].length;i++){
		datasets.push({'label': 'Y'+i, 'data':data['bycol'][options['yColumns'][i]]});
	}
	var labels = [];
	for (var i=0;i<data['bycol'][options['xColumn']].length;i++){
		labels.push(''+data['bycol'][options['xColumn']][i]);
	}
	if (!options.title) {options['title']=''}
	if (!options.tickCountY) {options['tickCountY']=''}
	if (!options.tickCountX) {options['tickCountX']=''}
	var baseJS = `
	<script>
	document.querySelector('#xkcdSvg').style.display = 'block';
	const lineChart = new chartXkcd.Line(document.querySelector('#xkcdSvg'), {
	  `+options.title+`
	  xLabel: 'Month', // optional
	  yLabel: '$ Dollars', // optional
	  data: {
		labels: `+JSON.stringify(labels)+`,
		datasets: `+JSON.stringify(datasets)+`,
	  },
	  options: { // optional
		`+options.tickCountY+`
		`+options.tickCountX+`
		legendPosition: chartXkcd.config.positionType.upLeft
	  }
	})
	</script>
	`;
	
	return baseJS;

}*/



exports.createGoogle = function(data,options) {
	var retArray = [['x','y']];
	for (var i=0;i<data['byrow'].length;i++) {
		if (i >= options['nHeaders']) {
			var tempA = [];
			for (var ii=0;ii<options['yColumns'].length;ii++) {
				var cell = data['byrow'][i][options['yColumns'][ii]];
				tempA.push(cell);
			}
			retArray.push(tempA);
		}
	}

	if (!options.title) {options['title']=''}
	var baseJS = `
	<script>
	  document.getElementById('googleChart').style.display = 'block';
	  google.charts.load('current', {'packages':['corechart']});
	  google.charts.setOnLoadCallback(drawChart);

	  function drawChart() {
		var data = google.visualization.arrayToDataTable(`+JSON.stringify(retArray)+`);

		var options = {
		  `+options.title+`
		  curveType: 'function',
		  legend: { position: 'bottom' }
		};

		var chart = new google.visualization.LineChart(document.getElementById('googleChart'));

		chart.draw(data, options);
	  }
	</script>
	`;
	return baseJS;

}