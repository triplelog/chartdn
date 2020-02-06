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