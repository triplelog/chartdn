exports.createPlotly = function(data,options) {
	var datasets = [];
	if (!options['yColumns'] || options['yColumns'].length == 0){return {};}
	for (var i=0;i<options['yColumns'].length;i++){
		if (options.xColumn != ''){
			datasets.push({'x':data['bycol'][options['xColumn']], 'y':data['bycol'][options['yColumns'][i]], 'type': 'bar'});
		}
		else {
			datasets.push({'x':i, 'y':data['bycol'][options['yColumns'][i]], 'type': 'bar'});

		}
	}
	
	chartOptions = {}
	if (options.title) {chartOptions['title']=options.title;}
	if (options.stepSizeX != '' && options.stepSizeX != 'default') {chartOptions['xaxis']={'dtick':options.stepSizeX};}
	if (options.stepSizeY != '' && options.stepSizeY != 'default') {chartOptions['yaxis']={'dtick':options.stepSizeY};}

	
	var chartJSON = {'data':datasets,'options':chartOptions}
	return chartJSON;

}

