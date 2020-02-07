
var ws = new WebSocket('wss://chartdn.com:8080');
ws.onopen = function(evt) {
	console.log(username);
	var jsonmessage = {'operation':'username','message':username};
	if (chartid != ""){jsonmessage['chartid']=chartid;}
	if (dataid != ""){jsonmessage['dataid']=dataid;}
	if (chartidtemp != ""){jsonmessage['chartidtemp']=chartidtemp;}
	ws.send(JSON.stringify(jsonmessage));
	
	var jsonmessage = {'operation':'view','id':chartid,'loc':0}
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
	else if (dm.operation == 'chart'){
		var chartJSON = dm.message;
		var allCharts = document.querySelectorAll('chartdn-chart');
		for (var i=0;i< allCharts.length;i++){
			if (allCharts[i].getAttribute('data-style')==dm.style){
				allCharts[i].makeChart(chartJSON);
			}
		}
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
var lineId = 0;

// Change Tab of which line to style
function chgLineTab(tabId){
	var menuList = document.getElementById('lineStyleMenu').childNodes[0];
	var menuItems = menuList.childNodes;
	for (var i=0;i<menuItems.length;i++){
		menuItems[i].classList.remove('pure-menu-selected');
	}
	console.log(menuItems);
	console.log(tabId);
	menuItems[tabId].classList.add('pure-menu-selected');
	lineId = tabId;
}

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
	
	var yColumns = [];
	var xColumn = '';
	
	var yCols = yColsStr.split(',');
	for (var i=0;i<yCols.length;i++){
		if (!isNaN(parseInt(yCols[i]))){ yColumns.push(parseInt(yCols[i]));}
	}
	
	if (!isNaN(parseInt(xColStr))){ xColumn = parseInt(xColStr);}
		
	var jsonmessage = {'operation':'options','yColumns':yColumns,'xColumn':xColumn};
	ws.send(JSON.stringify(jsonmessage));
}
function optionsChg(optionname) {
	if (optionname == 'xaxistitle' || optionname == 'yaxistitle'){
		var newoption = document.querySelector('input[name='+optionname+']').value;
		var jsonmessage = {'operation':'options','labels':{}};
		if (optionname == 'xaxistitle') {jsonmessage['labels']['x']=newoption;}
		else if (optionname == 'yaxistitle') {jsonmessage['labels']['y']=newoption;}
		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'stepSizeX' || optionname == 'stepSizeY'){
		var newoption = document.querySelector('input[name='+optionname+']').value;
		var jsonmessage = {'operation':'options','stepSize':{}};
		if (optionname == 'stepSizeX') {jsonmessage['stepSize']['x']=newoption;}
		else if (optionname == 'stepSizeY') {jsonmessage['stepSize']['y']=newoption;}
		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'shape'){
		var newoption = document.querySelector('input[name='+optionname+']:checked').value;
		var jsonmessage = {'operation':'options','lines':[]};
		for (var i=0;i<=lineId;i++){
			jsonmessage['lines'].push({});
		}
		jsonmessage['lines'][lineId]['shape']=newoption;
		ws.send(JSON.stringify(jsonmessage));
	}
	else {
		var newoption = document.querySelector('input[name='+optionname+']').value;
		var jsonmessage = {'operation':'options'};
		jsonmessage[optionname]=newoption;
		ws.send(JSON.stringify(jsonmessage));
	}
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
		console.log(el.id);
		for( var i = 0; i < yColsVals.length; i++){ 
		   if ( yColsVals[i] == parseInt(el.id.substring(5))) {
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
		columnsChg();
	}
});





