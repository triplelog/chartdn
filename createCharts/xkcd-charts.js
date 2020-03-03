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