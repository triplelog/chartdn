//Line, bar, pie/donut, scatter, bubble,
 
exports.createPlotly = function(data,options,cpptable) {
	var datasets = [];
	if (!options['yColumns'] || options['yColumns'].length == 0){return {};}
	for (var i=0;i<options['yColumns'].length;i++){
		dataObject = {};
		var myStyle = {};
		var allStyles = {};
		if (options.type == 'line'){
			if (options.lines) {
				for (var k in options.lines){
					if (options.lines[k].id == options['yColumns'][i] ){
						myStyle = options.lines[k];
					}
					else if (options.lines[k].id == -1 ){
						allStyles = options.lines[k];
					}
				}
			}
			for (var ii in allStyles){
				if (ii != 'id'){
					myStyle[ii] = allStyles[ii];
				}
			}
			if (myStyle.dots === false){dataObject['mode']='lines';}
			else {dataObject['mode']='lines+markers';}
			if (myStyle.color){dataObject['line']={'color': myStyle.color};}
			else {dataObject['line']={};}
			
			if (myStyle.shape && myStyle.shape != 'default'){dataObject['line']['shape']=myStyle.shape;}
			if (myStyle.dash){dataObject['line']['dash']=myStyle.dash;}
			if (myStyle.width){dataObject['line']['width']=myStyle.width;}
			
			if (myStyle.name){dataObject['name']=myStyle.name;}
		}
		else if (options.type == 'bar'){dataObject['type']='bar'}
		else if (options.type == 'pie'){dataObject['type']='pie'}
		else {dataObject['mode']='lines+markers'}
		
		if (options.type == 'line' || options.type == 'bar'){
			
			if (options.xColumn != ''){dataObject['x']=cpptable.readCol(options['xColumn']);}
			else {dataObject['x']=i;}
		
			dataObject['y']=cpptable.readCol(options['yColumns'][i]);
		}
		if (options.type == 'pie') {
			if (options.xColumn != ''){dataObject['labels']=cpptable.readCol(options['xColumn']);}
			else {dataObject['labels']=i;}
			
			dataObject['values']=cpptable.readCol(options['yColumns'][i]);
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
	//console.log(JSON.stringify(datasets));
	var chartJSON = {'data':datasets,'options':chartOptions};
	return chartJSON;

}

