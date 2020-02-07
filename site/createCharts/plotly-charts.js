//Line, bar, pie/donut, scatter, bubble,
 
exports.createPlotly = function(data,options) {
	var datasets = [];
	console.log(options);
	if (!options['yColumns'] || options['yColumns'].length == 0){return {};}
	for (var i=0;i<options['yColumns'].length;i++){
		dataObject = {};
		var myStyle = {};
		if (options.type == 'line'){
			if (options.lines) {myStyle = options.lines[Math.min(i,options.lines.length)];}
			if (myStyle.dots === false){dataObject['mode']='lines';}
			else {dataObject['mode']='lines+markers';}
			if (myStyle.color){dataObject['line']={'color': myStyle.color};}
			else {dataObject['line']={};}
			
			if (myStyle.shape){dataObject['line']['shape']=myStyle.shape;}
			if (myStyle.dash){dataObject['line']['dash']=myStyle.dash;}
			if (myStyle.width){dataObject['line']['width']=myStyle.width;}
			
			if (myStyle.name){dataObject['line']['name']=myStyle.name;}
		}
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
	
	chartOptions['xaxis']={};
	chartOptions['yaxis']={};
	if (options.stepSize){
		if (options.stepSize.x != '' && options.stepSize.x != 'default') {chartOptions['xaxis']['dtick']=options.stepSize.x;}
		if (options.stepSize.y != '' && options.stepSize.y != 'default') {chartOptions['yaxis']['dtick']=options.stepSize.y;}
	}
	if (options.labels){
		if (options.labels.x != '' && options.labels.x != 'default') {chartOptions['xaxis']['title']=options.labels.x;}
		if (options.labels.y != '' && options.labels.y != 'default') {chartOptions['yaxis']['title']=options.labels.y;}
	}
	//chartOptions['grid']= {rows: 2, columns: 1}
	
	var chartJSON = {'data':datasets,'options':chartOptions};
	return chartJSON;

}

