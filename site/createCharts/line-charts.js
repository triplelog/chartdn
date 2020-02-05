exports.createPlotly = function(data,options) {
	var datasets = [];
	if (!options['yColumns'] || options['yColumns'].length == 0){return {};}
	for (var i=0;i<options['yColumns'].length;i++){
		if (options.xColumn != ''){
			datasets.push({'x':data['bycol'][options['xColumn']], 'y':data['bycol'][options['yColumns'][i]], 'mode': 'lines+markers'});
		}
		else {
			datasets.push({'x':i, 'y':data['bycol'][options['yColumns'][i]], 'mode': 'lines+markers'});

		}
	}
	
	chartOptions = {}
	if (options.title) {chartOptions['title']=options.title;}
	if (options.stepSizeX != '' && options.stepSizeX != 'default') {chartOptions['xaxis']={'dtick':options.stepSizeX};}

	
	var chartJSON = {'data':datasets,'options':chartOptions}
	return chartJSON;

}
/*
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

}*/

function createJSdatasets(data,options) {
	var datasets = [];
	

	for (var i=0;i<options.yColumns.length;i++){
		var newdataset = {'label':'Label','data':[],'fill':false};
		for (var ii=0;ii<data['bycol'][options.yColumns[i]].length;ii++){
			if (options.xColumn != ''){
				newdataset['data'].push({'x':data['bycol'][options.xColumn][ii], 'y':data['bycol'][options.yColumns[i]][ii]});
			}
			else {
				newdataset['data'].push({'x':ii, 'y':data['bycol'][options.yColumns[i]][ii]});

			}
		}
		if (options.lineColor) {newdataset['borderColor']=lineColor}
		if (options.dotColor) {newdataset['backgroundColor']=dotColor}
			
		datasets.push(newdataset);
	}
	return datasets;
}
exports.createChartjs = function(data,options) {
	if (!options['yColumns'] || options['yColumns'].length == 0){return {};}
	
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
	if (!options['yColumns'] || options['yColumns'].length == 0){return {};}


	for (var i=0;i<options.yColumns.length;i++){
		datasets.push({'label': 'Y'+i, 'data':data['bycol'][options.yColumns[i]]});
	}
	
	var labels = [];
	if (options.xColumn != ''){
		for (var i=0;i<data['bycol'][options.xColumn].length;i++){
			labels.push(''+data['bycol'][options.xColumn][i]);
		}
	}
	else {
		for (var i=0;i<data['bycol'][options.yColumns[0]].length;i++){
			labels.push(''+i);
		}
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

	if (options.title != '' && options.title != 'notitle') {chartJSON['title']=options.title;}
	/*if (!options.tickCountY) {options['tickCountY']=''}
	if (!options.tickCountX) {options['tickCountX']=''}*/
	return chartJSON;

}
exports.createGoogle = function(data,options) {
	
	var retArray = [[]];
	if (options.xColumn != ''){
		retArray[0].push('x');
	}
	for (var ii=0;ii<options.yColumns.length;ii++) {
		retArray[0].push('y'+ii);
	}
	for (var i=0;i<data['byrow'].length;i++) {
		if (i >= options['nHeaders']) {
			var tempA = [];
			var ecol = 0;
			if (options.xColumn != ''){
				var cell = data['byrow'][i][options.xColumn];
				if (isNaN(cell)){continue;}
				tempA.push(cell);
				ecol = 1;
			}
			for (var ii=0;ii<options.yColumns.length;ii++) {
				var cell = data['byrow'][i][options.yColumns[ii]];
				if (isNaN(cell)){continue;}
				tempA.push(cell);
				
			}
			if (tempA.length<options.yColumns.length+ecol){continue;}
			retArray.push(tempA);
		}
	}

	var chartJSON = {'retArray':retArray,'options':{
		  curveType: 'function',
		  legend: { position: 'bottom' }
		}};
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

}



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

}*/