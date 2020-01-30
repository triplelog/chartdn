class chartdnChart extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();
	var _this = this;
    const shadowRoot = this.attachShadow({mode: 'open'});
  	
	shadowRoot.innerHTML = `<div class="chart-container" style="position: relative;">
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
