class chartdnChart extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();
	var _this = this;
    const shadowRoot = this.attachShadow({mode: 'open'});
  	shadowRoot.innerHTML = `<div class="chart-container" style="position: relative;">
		<canvas id="myChart" style="display: none;"></canvas>
	</div>`;
	if (this.getAttribute('type') != 'chartJS'){
		this.chgType(this.getAttribute('type'));
	}
	
	this.googleEl = shadowRoot.querySelector('#googleChart');
	
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
    var el = this.shadowRoot.querySelector('#googleChart');
  	el.style.display = 'block';
	google.charts.load('current', {'packages':['corechart']});
	google.charts.setOnLoadCallback(this.drawChart);
  }
  drawChart() {
  	var _this = this;
  	var data = google.visualization.arrayToDataTable([]);
	var chart = new google.visualization.LineChart(_this.googleEl);
	chart.draw(data, {});
  }
  
  makeChart(chartJSON){
  	if (this.getAttribute('type') == 'XKCD'){
  		this.makeXkcd(chartJSON);
  	}
  	else if (this.getAttribute('type') == 'google'){
  		this.makeGoogle(chartJSON);
  	}
  	else {
  		this.makeChartjs(chartJSON);
  	}
  }
  chgType(type) {
  	if (type == 'XKCD'){
  		this.shadowRoot.innerHTML = `<div class="chart-container" style="position: relative;">
					<svg id="xkcdSvg" style="display: none;"></svg>
				</div>`;
  	}
  	else if (type == 'google') {
  		this.shadowRoot.innerHTML = `<div class="chart-container" style="position: relative;">
					<div id="googleChart" style="display: none;"></div>
				</div>`;
  	}
  	else if (type == 'chartJS') {
  		this.shadowRoot.innerHTML = `<div class="chart-container" style="position: relative;">
			<canvas id="myChart" style="display: none;"></canvas>
		</div>`;
  	}
  	
  }
}

customElements.define('chartdn-chart', chartdnChart);
