//Line, bar, pie/donut, scatter, bubble,
 
exports.createPlotly = function(data,options) {
	var datasets = [];
	if (!options['yColumns'] || options['yColumns'].length == 0){return {};}
	for (var i=0;i<options['yColumns'].length;i++){
		dataObject = {};
		if (options.type == 'line'){dataObject['mode']='lines+markers'}
		else if (options.type == 'bar'){dataObject['type']='bar'}
		else if (options.type == 'pie'){dataObject['type']='pie'}
		else {dataObject['mode']='lines+markers'}
		
		if (options.type == 'line' || options.type == 'bar'){
			if (options.xColumn != ''){dataObject['x']=data['bycol'][options['xColumn']];}
			else {dataObject['x']=i;}
		
			dataObject['y']=data['bycol'][options['yColumns'][i]];
		}
		if (options.type == 'pie') {
			if (options.xColumn != ''){dataObject['labels']=data['bycol'][options['xColumn']];}
			else {dataObject['labels']=i;}
			
			dataObject['values']=data['bycol'][options['yColumns'][i]];
			dataObject['hole']=.5;
		}
		
		datasets.push(dataObject);
	}
	
	chartOptions = {}
	if (options.title) {chartOptions['title']=options.title;}
	if (options.stepSizeX != '' && options.stepSizeX != 'default') {chartOptions['xaxis']={'dtick':options.stepSizeX};}
	if (options.stepSizeY != '' && options.stepSizeY != 'default') {chartOptions['yaxis']={'dtick':options.stepSizeY};}
	//chartOptions['grid']= {rows: 2, columns: 1}
	
	var chartJSON = {'data':datasets,'options':chartOptions}
	return chartJSON;

}

