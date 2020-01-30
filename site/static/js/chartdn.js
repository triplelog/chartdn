
var ws = new WebSocket('wss://chartdn.com:8080');
ws.onopen = function(evt) {
	console.log(username);
	var jsonmessage = {'operation':'username','message':username};
	if (chartid != ""){jsonmessage['chartid']=chartid;}
	if (dataid != ""){jsonmessage['dataid']=dataid;}
	if (chartidtemp != ""){jsonmessage['chartidtemp']=chartidtemp;}
	ws.send(JSON.stringify(jsonmessage));
}
ws.onmessage = function(evt){
	var dm = JSON.parse(evt.data);
	if (dm.operation == 'downloaded'){
		document.getElementById('dataCopy').value = dm.message;
		dataChg();
	}
	else if (dm.operation == 'id'){
		chartid = dm.message;
	}
}



function getOrdinal(n) {
   var s=["th","st","nd","rd"],
       v=n%100;
   return n+(s[(v-20)%10]||s[v]||s[0]);
}
// Set options like number of Header Rows
var nHeaders = 1;
var filters = [];
var yColsVals = [];

//Download from url
function urlChg(url) {
	var url = document.getElementById('dataUrl').value;
	var jsonmessage = {'operation':'download','message':url};
	ws.send(JSON.stringify(jsonmessage));
}


//Set columns in Create Chart
var allColumns = document.getElementById('allColumns');
allColumns.innerHTML = '';
document.getElementById('xColumn').innerHTML = '';
document.getElementById('yColumns').innerHTML = '';

// Show table input type
var dataFile = document.getElementById("dataFile");
var dropArea = document.getElementById("dropArea");
var dataCopy = document.getElementById("dataCopy");
var dataUrl = document.getElementById("dataUrl");
dataCopy.style.display = 'none';
dataUrl.style.display = 'none';
function dst() {
	var radioChecked = document.querySelector("input[name=dataSourceType]:checked").value;
	if (radioChecked == 'File'){
		dataFile.style.display = 'inline-block';
		dropArea.style.display = 'inline-block';
		dataCopy.style.display = 'none';
		dataUrl.style.display = 'none';
	}
	else if (radioChecked == 'Copy'){
		dataCopy.style.display = 'inline-block';
		dataFile.style.display = 'none';
		dropArea.style.display = 'none';
		dataUrl.style.display = 'none';
	}
	else if (radioChecked == 'Url'){
		dataUrl.style.display = 'inline-block';
		dataCopy.style.display = 'none';
		dataFile.style.display = 'none';
		dropArea.style.display = 'none';
	}
}

// Set table if already have data
var oldData = document.getElementById('dataCopy').value;
if (oldData.length > 0){
	dataChg(true);
}
		
		
function headerChg() {
	nHeaders = parseInt(document.getElementById('nHeaders').value);
	var jsonmessage = {'operation':'options','nHeaders':nHeaders};
	ws.send(JSON.stringify(jsonmessage));
}
function columnsChg() {
	var yColsStr = document.getElementById('yColsVal').value;
	var xColStr = document.getElementById('xColVal').value;
	var jsonmessage = {'operation':'options','yColumns':yColsStr,'xColumn':xColStr};
	ws.send(JSON.stringify(jsonmessage));
}
function filterChg() {
	var isChecked = document.querySelectorAll('input[name="filter"]:checked');
	filters = [];
	for (var i=0;i<isChecked.length;i++){
		filters.push(isChecked[i].id);
	}
	var jsonmessage = {'operation':'options','filters':filters};
	ws.send(JSON.stringify(jsonmessage));
}
function typeChg() {
	var isChecked = document.querySelector('input[name="chartType"]:checked');

	var jsonmessage = {'operation':'options','type':isChecked.value};
	ws.send(JSON.stringify(jsonmessage));
}
function dataChg(initialData=false) {
	
	var dataTable = document.getElementById("dataTable");
	var csv = dataCopy.value;
	if (!initialData){
		var jsonmessage = {'operation':'upload','message':csv};
		ws.send(JSON.stringify(jsonmessage));
	}
	var data = Papa.parse(csv).data;
	dataTable.innerHTML = '';
	var headers = [];
	var includeHeaders = false;
	for (var i=0;i<data.length;i++){
		var newrow = document.createElement('tr');
		if (i < nHeaders) {
			newrow.classList.add('headerrow');
		}
		for (var ii=0;ii<data[i].length;ii++){
			var newcell = document.createElement('td');
			newcell.textContent = data[i][ii];
			newrow.appendChild(newcell);
			if (i==0){
				if (nHeaders > 0) {
					headers.push(data[i][ii]);
				}
				else {
					headers.push(getOrdinal(ii+1));
				}
			}
		}
		dataTable.appendChild(newrow);
		
	}
	allColumns.innerHTML = '';
	for (var i=0;i<headers.length;i++){
		var newColumn = document.createElement('span');
		newColumn.textContent = headers[i];
		newColumn.id = 'colId'+i;
		newColumn.style.display = 'block';
		allColumns.appendChild(newColumn);
	}
	if (initialData && document.getElementById('xColVal').value != ''){
		var xcv = parseInt(document.getElementById('xColVal').value);
		document.getElementById('xColumn').innerHTML = '';
		var newColumn = document.createElement('span');
		newColumn.textContent = headers[xcv];
		newColumn.id = 'colId'+xcv;
		newColumn.style.display = 'block';
		document.getElementById('xColumn').appendChild(newColumn);
	}
	if (initialData && document.getElementById('yColsVal').value != ''){
		yColsVals = document.getElementById('yColsVal').value.split(',');
		document.getElementById('yColumns').innerHTML = '';
		var ycvStr = '';
		for (var yid in yColsVals){
			yColsVals[yid] = parseInt(yColsVals[yid]);
			ycvStr += yColsVals[yid]+', ';
			var newColumn = document.createElement('span');
			newColumn.textContent = headers[yColsVals[yid]];
			newColumn.id = 'colId'+yColsVals[yid];
			newColumn.style.display = 'block';
			document.getElementById('yColumns').appendChild(newColumn);
		}
		document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
		
	}
	
	
	
}



//Dragula with column choices

var drake = dragula([document.getElementById('allColumns'), document.getElementById('xColumn'), document.getElementById('yColumns')], {
  copy: function (el, source) {
    return source === document.getElementById('allColumns');
  },
  accepts: function (el, target, source) {
  	if (target === document.getElementById('allColumns')) {return false;}
  	if (target === source || target.id === 'xColumn'){return true;}
  	for (var yid in yColsVals){
  		if ('colId'+yColsVals[yid] == el.id){return false;}
  	}
  	return true;
    
  },
  removeOnSpill: function (el, source) {
    return source !== document.getElementById('allColumns');
  }
});

drake.on('drop', function (el, target, source) { 
	if (target.id == 'xColumn') {
		target.innerHTML = ''; target.appendChild(el);
		document.getElementById('xColVal').value = el.id.substring(5);
		columnsChg();
	}
	else if (target.id == 'yColumns') {
		yColsVals.push(el.id.substring(5));
		var ycvStr = '';
		for (var yid in yColsVals){
			ycvStr += yColsVals[yid]+', ';
		}
		document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
		columnsChg();
		
	}
});
drake.on('remove', function (el, target, source) { 
	if (source.id == 'xColumn') {
		document.getElementById('xColVal').value = '';
		columnsChg();
	}
	else if (source.id == 'yColumns') {
		for( var i = 0; i < yColsVals.length; i++){ 
		   if ( yColsVals[i] === el.id.substring(5)) {
			 yColsVals.splice(i, 1);
			 break;
		   }
		}
		if (yColsVals.length > 0) {
			var ycvStr = '';
			for (var yid in yColsVals){
				ycvStr += yColsVals[yid]+', ';
			}
			document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
		}
		else {
			document.getElementById('yColsVal').value = '';
		}
		console.log(yColsVals,document.getElementById('yColsVal').value);
		columnsChg();
	}
});




class chartdnChart extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();
	var _this = this;
    this.ws = new WebSocket('wss://chartdn.com:8080');
    const shadowRoot = this.attachShadow({mode: 'open'});
  	
	shadowRoot.innerHTML = `Chart JS
	<div class="chart-container" style="position: relative;">
		<canvas id="myChart" style="display: none;"></canvas>
	</div>`;
	shadowRoot.querySelector('#myChart').style.display = 'block';
	this.makeChart();
	
  }
  makeChart() {
  	var ctx = this.shadowRoot.querySelector('#myChart').getContext('2d');
	var myLineChart = new Chart(ctx, {
		type: 'line',
		data: {
			datasets: [{"label":"Label","data":[{"x":4850771,"y":2350806},{"x":738565,"y":386319},{"x":6809946,"y":3385055},{"x":2977944,"y":1461651},{"x":38982847,"y":19366579},{"x":5436519,"y":2731315},{"x":3594478,"y":1754046},{"x":943732,"y":456876},{"x":672391,"y":319046},{"x":20278447,"y":9914361},{"x":10201635,"y":4968887},{"x":1421658,"y":713981},{"x":1657375,"y":830627},{"x":12854526,"y":6312600},{"x":6614418,"y":3258279},{"x":3118102,"y":1548035},{"x":2903820,"y":1445980},{"x":4424376,"y":2179025},{"x":4663461,"y":2281239},{"x":1330158,"y":651040},{"x":5996079,"y":2906277},{"x":6789319,"y":3293426},{"x":9925568,"y":4880579},{"x":5490726,"y":2731831},{"x":2986220,"y":1448717},{"x":6075300,"y":2981332},{"x":1029862,"y":517860},{"x":1893921,"y":943547},{"x":2887725,"y":1450091},{"x":1331848,"y":659131},{"x":8960161,"y":4372321},{"x":2084828,"y":1032086},{"x":19798228,"y":9604111},{"x":10052564,"y":4895368},{"x":745475,"y":382121},{"x":11609756,"y":5686081},{"x":3896251,"y":1930615},{"x":4025127,"y":1993822},{"x":12790505,"y":6260160},{"x":1056138,"y":512581},{"x":4893444,"y":2376759},{"x":855444,"y":430587},{"x":6597381,"y":3217073},{"x":27419612,"y":13616977},{"x":2993941,"y":1506614},{"x":624636,"y":308026},{"x":8365952,"y":4113988},{"x":7169967,"y":3580888},{"x":1836843,"y":907621},{"x":5763217,"y":2864115},{"x":583200,"y":298301}],"fill":false}],
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						
					}
				}],
				xAxes: [{
					type: 'linear',
					position: 'bottom',
					ticks: {
						
					}
				}]
			},
			
		
		}
	});
  }
}
customElements.define('chartdn-chart', chartdnChart);

