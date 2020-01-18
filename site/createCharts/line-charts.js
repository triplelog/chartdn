
exports.createPlotly = function() {
var baseJS = `
<script>
document.getElementById('plotlyDiv').style.display = 'block';
var trace3 = {
  x: replacexarray,
  y: replaceyarray,
  mode: 'lines+markers'
};

var data = [ trace3 ];

var layout = {
  {{ title }}
  {{ xaxis }}
  {{ yaxis }}
  
};

Plotly.newPlot('plotlyDiv', data, layout);
</script>
`;
return baseJS;

}

exports.createChartjs = function() {
var baseJS = `
<script>
document.getElementById('myChart').style.display = 'block';
var ctx = document.getElementById('myChart').getContext('2d');
var myLineChart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Label',
            data: replaceobjectarray,
            fill: false,
            {{ dotColor }}
            {{ lineColor }}
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    {{ stepSizeY }}
                }
            }],
            xAxes: [{
                type: 'linear',
                position: 'bottom',
                ticks: {
                    {{ stepSizeX }}
                }
            }]
        },
        {{ title }}
        
    }
});
</script>
`;
return baseJS;

}

exports.createXkcd = function(data,options) {
	var datasets = [];
	for (var i=0;i<options['yColumns'].length;i++){
		datasets.push({'label': 'Y'+i, 'data':data['bycol'][options['yColumns'][i]]});
	}
	var labels = [];
	for (var i=0;i<data['bycol'][options['xColumn']].length;i++){
		labels.push(data['bycol'][options['xColumn']][i]);
	}
	var baseJS = `
	<script>
	document.querySelector('#xkcdSvg').style.display = 'block';
	const lineChart = new chartXkcd.Line(document.querySelector('#xkcdSvg'), {
	  {{ title }}
	  xLabel: 'Month', // optional
	  yLabel: '$ Dollars', // optional
	  data: {
		labels: `+JSON.stringify(labels)+`,
		datasets: `+JSON.stringify(datasets)+`,
	  },
	  options: { // optional
		{{ tickCountY }}
		{{ tickCountX }}
		legendPosition: chartXkcd.config.positionType.upLeft
	  }
	})
	</script>
	`;
	return baseJS;

}



exports.createGoogle = function() {
var baseJS = `
<script>
  document.getElementById('googleChart').style.display = 'block';
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
	var data = google.visualization.arrayToDataTable(replacefullarray);

	var options = {
	  {{ title }}
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