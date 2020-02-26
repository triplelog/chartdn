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
  
  static get observedAttributes() { return ["src"]; }
  attributeChangedCallback(name, oldValue, newValue) {
	  if (name == 'src' && oldValue && oldValue != '' && ws.readyState == 1){
	  	console.log(newValue);
	  	var jsonmessage = {'operation':'view','id':newValue,'loc':this.getAttribute('data-loc'),'style':this.getAttribute('data-style')}
		ws.send(JSON.stringify(jsonmessage));
	  }
  }
  
  makeChartjs(chartJSON) {
  	this.querySelector('#myChart').style.display = 'block';
  	var ctx = this.querySelector('#myChart').getContext('2d');
	var myLineChart = new Chart(ctx, chartJSON);
  }
  makeXkcd(chartJSON) {
  	this.querySelector('#xkcdSvg').style.display = 'block';
	const lineChart = new chartXkcd.Line(this.querySelector('#xkcdSvg'), chartJSON);
  }
  makeGoogle(chartJSON) {
  	googleArray = chartJSON.retArray;
  	googleOptions = chartJSON.options;
    var el = this.querySelector('#googleChart');
  	el.style.display = 'block';
	google.charts.load('current', {'packages':['corechart']});
	google.charts.setOnLoadCallback(drawChart);
  }
  makePlotly(chartJSON) {
  	this.querySelector('#plotlyDiv').style.display = 'block';
  	if (this.getAttribute('data-shape') == 1 && chartJSON.options){
  		if (!chartJSON.options['margin']){
  			chartJSON.options['margin'] = {};
  		}
  		chartJSON.options['margin']['l']= 40;
  		chartJSON.options['margin']['r']= 40;
  		chartJSON.options['margin']['t']= 100;
  		chartJSON.options['margin']['b']= 80;
  	}
  	else if (this.getAttribute('data-shape') == 2 && chartJSON.options){
  		if (!chartJSON.options['margin']){
  			chartJSON.options['margin'] = {};
  		}
  		chartJSON.options['margin']['l']= 60;
  		chartJSON.options['margin']['t']= 75;
  		chartJSON.options['margin']['b']= 60;
  	}
  	else if (this.getAttribute('data-shape') == 3 && chartJSON.options){
  		if (!chartJSON.options['margin']){
  			chartJSON.options['margin'] = {};
  		}
  		chartJSON.options['margin']['l']= 80;
  		chartJSON.options['margin']['t']= 50;
  		chartJSON.options['margin']['b']= 40;
  	}
	Plotly.newPlot(this.querySelector('#plotlyDiv'), chartJSON.data, chartJSON.options, {responsive: true});
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
  		this.innerHTML = `<div class="chart-container" style="position: relative;">
					<svg id="xkcdSvg" style="display: none;"></svg>
				</div>`;
  	}
  	else if (style == 'google') {
  		this.innerHTML = `<div class="chart-container" style="position: relative;">
					<div id="googleChart" style="display: none;"></div>
				</div>`;
  	}
  	else if (style == 'plotly') {
  		var plotlyheight = '';
  		if (this.getAttribute('height')) {
  			plotlyheight = 'height: '+this.getAttribute('height')+';';
  		}
  		this.innerHTML = `<div class="chart-container" style="position: relative;">
					<div id="plotlyDiv" style="display: none; `+plotlyheight+`"></div>
				</div>`;
  	}
  	else if (style == 'chartJS') {
  		this.innerHTML = `<div class="chart-container" style="position: relative;">
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
