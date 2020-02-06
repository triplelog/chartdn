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