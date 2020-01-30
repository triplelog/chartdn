var ws = new WebSocket('wss://chartdn.com:8080');
ws.onopen = function(evt) {
	var allcharts = document.querySelectorAll('chartdn-chart');
	for (var i=0;i<allcharts.length;i++){
		var jsonmessage = {'operation':'view','id':allcharts[i].getAttribute('src'),'loc':i}
		ws.send(JSON.stringify(jsonmessage));
	}
	
}
ws.onmessage = function(evt){
	var dm = JSON.parse(evt.data);
	if (dm.operation == 'chart'){
		var chartJSON = dm.message;
		console.log(chartJSON);
		document.querySelectorAll('chartdn-chart')[parseInt(dm.loc)].makeChart(chartJSON);
	}
}

class chartdnChart extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();
	var _this = this;
    const shadowRoot = this.attachShadow({mode: 'open'});
  	
	shadowRoot.innerHTML = `Chart JS
	<div class="chart-container" style="position: relative;">
		<canvas id="myChart" style="display: none;"></canvas>
	</div>`;
	shadowRoot.querySelector('#myChart').style.display = 'block';
	
  }
  makeChart(chartJSON) {
  	var ctx = this.shadowRoot.querySelector('#myChart').getContext('2d');
	var myLineChart = new Chart(ctx, chartJSON);
  }
}
customElements.define('chartdn-chart', chartdnChart);
