var chartid = '';
var ws = new WebSocket('wss://tabdn.com:8080');
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
// Set number of Header Rows
var nHeaders = 1;

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
function headerChg() {
	nHeaders = parseInt(document.getElementById('nHeaders').value);
}
function dataChg() {
	
	var dataTable = document.getElementById("dataTable");
	var csv = dataCopy.value;
	var jsonmessage = {'operation':'upload','message':csv};
	ws.send(JSON.stringify(jsonmessage));
	var data = Papa.parse(csv).data;
	dataTable.innerHTML = '';
	var headers = [];
	var includeHeaders = false;
	for (var i=0;i<data.length;i++){
		var newrow = document.createElement('tr');
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
	
	
	
}



//Dragula with column choices

var drake = dragula([document.getElementById('allColumns'), document.getElementById('xColumn'), document.getElementById('yColumns')], {
  copy: function (el, source) {
    return source === document.getElementById('allColumns');
  },
  accepts: function (el, target) {
    return target !== document.getElementById('allColumns');
  },
  removeOnSpill: function (el, source) {
    return source !== document.getElementById('allColumns');
  }
});
drake.on('drop', function (el, container) { 
	if (container.id == 'xColumn') {
		container.innerHTML = ''; container.appendChild(el);
		document.getElementById('xColVal').value = el.id.substring(5);
	}
	else if (container.id == 'yColumns') {
		document.getElementById('yColsVal').value += el.id.substring(5);
	}
});