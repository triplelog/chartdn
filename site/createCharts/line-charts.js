
exports.createLine = function(alldata,csvdata) {

	//var frameworks = alldata.framework;
	var frameworks = ['latex','xkcd','google','plotly','chartjs'];
	var xColumn = 0;
	var yColumns = [];//parseInt(alldata.yColumns);
	if (!isNaN(parseInt(alldata.xColumn))){ xColumn = parseInt(alldata.xColumn);}
	var yCols = alldata.yColumns.split(',');
	for (var i=0;i<yCols.length;i++){
		if (!isNaN(parseInt(yCols[i]))){ yColumns.push(parseInt(yCols[i]));}
	}
	if(yColumns.length==0){
		yColumns.push(1);
	}
	var nHeaders = parseInt(alldata.nHeaders);
	var title = alldata.title;
	var stepSizeX = alldata.stepSizeX;
	var stepSizeY = alldata.stepSizeY;
	var lineColor = alldata.lineColor;
	var dotColor = alldata.dotColor;

	if (!mydata || mydata.length == 0){
		return '';
	}


	var bothArrays = csvdata;
	var fullArray = bothArrays[0];
	var colArrays = bothArrays[1];

	var fullJS = '';

	for (var i=0;i<frameworks.length;i++){
		var options = {};
		if (frameworks[i] == 'latex'){
			fullJS += '';
		}
		else if (frameworks[i] == 'xkcd'){
			if (title != '' && title != 'notitle') {options['title'] = 'title: "'+title+'",';}
			fullJS += nunjucks.renderString(createXkcdLine(),options);
		}
		else if (frameworks[i] == 'google'){
			if (title != '' && title != 'notitle') {options['title'] = 'title: "'+title+'",';}
			fullJS += nunjucks.renderString(createGoogleLine(),options);
		}
		else if (frameworks[i] == 'plotly'){
			if (title != '' && title != 'notitle') {options['title'] = 'title: "'+title+'",';}
			if (stepSizeX != '' && stepSizeX != 'default') {options['xaxis'] = 'xaxis: {dtick: '+stepSizeX+'},' }
			if (stepSizeY != '' && stepSizeY != 'default') {options['yaxis'] = 'yaxis: {dtick: '+stepSizeY+'},' }
			fullJS += nunjucks.renderString(createPlotlyLine(),options);
		}
		else if (frameworks[i] == 'chartjs'){
			if (title != '' && title != 'notitle') {options['title'] = 'title: {display: true, text: "'+title+'"},';}
			if (stepSizeX != '' && stepSizeX != 'default') {options['stepSizeX'] = 'stepSize: '+stepSizeX+',' }
			if (stepSizeY != '' && stepSizeY != 'default') {options['stepSizeY'] = 'stepSize: '+stepSizeY+',' }
			if (lineColor != '' && lineColor != 'default') {options['lineColor'] = 'borderColor: "'+lineColor+'",'}
			if (dotColor != '' && dotColor != 'default') {options['dotColor'] = 'backgroundColor: "'+dotColor+'",'}
		
			fullJS += nunjucks.renderString(createChartjsLine(),options);
		}
	}
	//fullJS += endJS;

	fullJS = fullJS.replace(/replacexarray/g,JSON.stringify(colArrays[xColumn]));
	fullJS = fullJS.replace(/replaceyarray/g,JSON.stringify(colArrays[yColumns[0]]));
	fullJS = fullJS.replace(/replaceyyarray/g,JSON.stringify(colArrays[2]));
	fullJS = fullJS.replace(/replacefullarray/g,JSON.stringify(fullArray));
	fullJS = fullJS.replace(/replaceobjectarray/g,JSON.stringify(bothArrays[2]));



	return fullJS;
}











function createPlotlyLine() {
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

function createChartjsLine() {
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

function createXkcdLine() {
var baseJS = `
<script>
document.querySelector('#xkcdSvg').style.display = 'block';
const lineChart = new chartXkcd.Line(document.querySelector('#xkcdSvg'), {
  {{ title }}
  xLabel: 'Month', // optional
  yLabel: '$ Dollars', // optional
  data: {
    labels: ['1','2','7','4','5'],
    datasets: [{
      label: 'Plan',
      data: replaceyarray,
    }, {
      label: 'Reality',
      data: replaceyyarray,
    }],
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



function createGoogleLine() {
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