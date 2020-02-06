






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