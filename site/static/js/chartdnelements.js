class chartdnChart extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();
	var _this = this;
  	this.innerHTML = `<div class="chart-container" style="position: relative;">
		<canvas id="myChart" style="display: none;"></canvas>
	</div>`;
	if (this.getAttribute('data-style') != 'chartJS'){
		this.chgType(this.getAttribute('data-style'));
	}
	
	googleEl = this.querySelector('#googleChart');
	
  }
  
  makeChartjs(chartJSON) {
  	
  	this.shadowRoot.querySelector('#myChart').style.display = 'block';
  	var ctx = this.shadowRoot.querySelector('#myChart').getContext('2d');
	var myLineChart = new Chart(ctx, chartJSON);
  }
  makeXkcd(chartJSON) {
  	this.shadowRoot.querySelector('#xkcdSvg').style.display = 'block';
	const lineChart = new chartXkcd.Line(this.shadowRoot.querySelector('#xkcdSvg'), chartJSON);
  }
  makeGoogle(chartJSON) {
  	googleArray = chartJSON.retArray;
  	googleOptions = chartJSON.options;
    var el = this.shadowRoot.querySelector('#googleChart');
  	el.style.display = 'block';
	google.charts.load('current', {'packages':['corechart']});
	google.charts.setOnLoadCallback(drawChart);
  }
  makePlotly(chartJSON){
  	this.querySelector('#plotlyDiv').style.display = 'block';

	Plotly.newPlot(this.querySelector('#plotlyDiv'), chartJSON.data, chartJSON.options);
  }
  
  
  makeChart(chartJSON){
  	if (this.getAttribute('data-style') == 'XKCD'){
  		this.makeXkcd(chartJSON);
  	}
  	else if (this.getAttribute('data-style') == 'google'){
  		this.makeGoogle(chartJSON);
  	}
  	else if (this.getAttribute('data-style') == 'plotly'){
  		this.makePlotly(chartJSON);
  	}
  	else {
  		this.makeChartjs(chartJSON);
  	}
  }
  chgType(style) {
  	if (style == 'XKCD'){
  		this.shadowRoot.innerHTML = `<div class="chart-container" style="position: relative;">
					<svg id="xkcdSvg" style="display: none;"></svg>
				</div>`;
  	}
  	else if (style == 'google') {
  		this.shadowRoot.innerHTML = `<div class="chart-container" style="position: relative;">
					<div id="googleChart" style="display: none;"></div>
				</div>`;
  	}
  	else if (style == 'plotly') {
  		this.innerHTML = `<div class="chart-container" style="position: relative;">
					<div id="plotlyDiv" style="display: none;"></div>
				</div>`;
  	}
  	else if (style == 'chartJS') {
  		this.shadowRoot.innerHTML = `<div class="chart-container" style="position: relative;">
			<canvas id="myChart" style="display: none;"></canvas>
		</div>`;
  	}
  	
  	
  }
}
var googleEl;
var googleArray;
var googleOptions;
function drawChart() {
  	var data = google.visualization.arrayToDataTable(googleArray);
	var chart = new google.visualization.LineChart(googleEl);
	chart.draw(data, googleOptions);
}
customElements.define('chartdn-chart', chartdnChart);
