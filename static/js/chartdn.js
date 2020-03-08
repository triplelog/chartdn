
var ws = new WebSocket('wss://chartdn.com:8080');
ws.onopen = function(evt) {
	
	var jsonmessage = {'operation':'key','message':key};
	jsonmessage['chartid']=chartid;
	ws.send(JSON.stringify(jsonmessage));
	
	initialLoad();
	var jsonmessage = {'operation':'view','id':chartid,'loc':0}
	ws.send(JSON.stringify(jsonmessage));
	
}
ws.onmessage = function(evt){
	var dm;
	if (evt.data[0]=='{'){
		dm = JSON.parse(evt.data);
	}
	else {
		var strData = atob(evt.data);
		var charData = strData.split('').map(function(x){return x.charCodeAt(0);});
		var binData = new Uint8Array(charData);
		var newData = pako.inflate(binData,{to:'string'});
		dm = JSON.parse(newData);
	}
	//var d = new Date(); var n = d.getTime(); console.log('time6: ', n);

	if (dm.operation == 'chart'){
		//var d = new Date(); var n = d.getTime(); console.log('time7: ', n);
		var chartJSON = dm.message;
		var allCharts = document.querySelectorAll('chartdn-chart');
		for (var i=0;i< allCharts.length;i++){
			if (allCharts[i].getAttribute('data-style')==dm.style){
				allCharts[i].makeChart(chartJSON);
			}
		}
		if (dm.mdata){
			updateTable(dm.mdata,dm.allHeaders.modified);
			allHeaders = dm.allHeaders;
			headersChanged(false,true);
			updateColumns();
		}
		var plotlyOverlay = document.getElementById('plotlyOverlay');
		if (plotlyOverlay){
			plotlyOverlay.style.display = 'none';
		}
		var dataTableOverlay = document.getElementById('dataTableOverlay');
		if (dataTableOverlay){
			dataTableOverlay.style.display = 'none';
		}
	}
	else if (dm.operation == 'headers'){
		var oldHeaders = [];
		for (var i in headers){
			oldHeaders.push(headers[i]);
		}
		headers = dm.message;
		headersChanged(true,oldHeaders);
	}
	else if (dm.operation == 'loading'){
		var dataTableOverlay = document.getElementById('dataTableOverlay');
		if (dataTableOverlay){
			dataTableOverlay.innerHTML = dm.message;
			dataTableOverlay.style.display = 'block';
		}
		var plotlyOverlay = document.getElementById('plotlyOverlay');
		if (plotlyOverlay){
			plotlyOverlay.innerHTML = dm.message;
			plotlyOverlay.style.display = 'block';
		}
	}
}

function initialLoad() {
	
	minimizeBox('modifyData');
	minimizeBox('yAxis');
	var chartType = document.getElementById('chartTypeMenu').querySelector('option:checked').value;
	if (chartType == 'line'){
		showLineChartOptions();
	}
	for (var i in modifiers){
		if (modifiers[i].type == 'pivot'){
			createPivot(modifiers[i]);
		}
		else if (modifiers[i].type == 'sort'){
			createSort(modifiers[i]);
		}
		else if (modifiers[i].type == 'replace'){
			createReplace(modifiers[i]);
		}
		else if (modifiers[i].type == 'new'){
			createNew(modifiers[i]);
		}
		else if (modifiers[i].type == 'filter'){
			createFilter(modifiers[i]);
		}
	}
	let template = document.getElementById('dataOptionsTemplate');
	let tc = template.content.cloneNode(true);
	let el = document.getElementById('dataOptionsTippy');
	console.log(el);
	let dotippy = tippy(el, {
	  content: tc,
	  trigger: 'click',
	  interactive: true,
	  placement: 'top',
	});
	if (hasData){
		minimizeBox('dataSource');
		modifierChanged(false);
		headersChanged(true);
	}
	
}

function getOrdinal(n) {
   var s=["th","st","nd","rd"],
       v=n%100;
   return n+(s[(v-20)%10]||s[v]||s[0]);
}
// Set options like number of Header Rows
var nHeaders = 1;
var initialData;
var yColsVals = [];
var xColumn = '';
if (options.xColumn){
	xColumn = options.xColumn;
}
var headers = [];
var tippys = {};
var tippysR = {};
var allHeaders = {};
var colid = -1;
var minimizedBoxes = {};
var table = false;
var nsteps = -1;
var newnsteps = -1;
var userDataChanges = [];
var firstPaginate = false;
minimizedBoxes.dataSource = 'large';
minimizedBoxes.dataTable = 'large';
minimizedBoxes.modifyData = 'large';
minimizedBoxes.createChart = 'large';
minimizedBoxes.customChart = 'large';
minimizedBoxes.yAxis = 'large';
minimizedBoxes.yAxisData = 'large';
minimizedBoxes.yAxisFormat = 'large';
minimizedBoxes.chartjs = 'half';
minimizedBoxes.plotly = 'half';
minimizedBoxes.xkcd = 'half';
minimizedBoxes.google = 'half';

//Headers Changed
function headersChanged(initialData,chg=false) {
	if (allHeaders.current){
		headers = allHeaders.current;
	}
	else {
		headers = [];
	}
	var xCo = document.getElementById('xColumnSelect');
	xCo.innerHTML = '<option value="-1"></option>';
	var yCo = document.getElementById('yColumnSelect');
	yCo.innerHTML = '';
	for (var i=0;i<headers.length;i++){
		var newColumn = document.createElement('option');
		if (headers[i] == ''){
			var ii = i+1;
			newColumn.textContent = 'Col '+ii;
		}
		else {
			newColumn.textContent = headers[i];
		}
		
		newColumn.value = i;
		xCo.appendChild(newColumn.cloneNode(true));
		yCo.appendChild(newColumn);
	}
	if (!chg){
		/*var headerEls = document.querySelector('div.tabulator-headers');
		var headerTitleEls = headerEls.querySelectorAll('div.tabulator-col-title');
		for (var i=0;i<headerTitleEls.length;i++){
			headerTitleEls[i].style.backgroundColor = '#e6e6e6';
		}*/
		if (initialData && document.getElementById('xColVal').value != ''){
			var xcv = parseInt(document.getElementById('xColVal').value);
			document.getElementById('xColumnSelect').value =  xcv;
			/*if (nsteps == -1) {
				var qstring = 'div[tabulator-field="col'+xcv+'"] div.tabulator-col-title';
				var hEl = headerEls.querySelector(qstring);
				if (hEl){hEl.style.background = '#c6e6e6';}
			}*/
		}
		if (initialData && document.getElementById('yColsVal').value != ''){
			yColsVals = document.getElementById('yColsVal').value.split(',');
			document.getElementById('yAxisDataBox').innerHTML = '';
			var ycvStr = '';
			for (var yid in yColsVals){
				createLineDiv(yColsVals[yid]);
			
				yColsVals[yid] = parseInt(yColsVals[yid]);
				ycvStr += yColsVals[yid]+', ';
				var newColumn = document.createElement('span');
				newColumn.textContent = headers[yColsVals[yid]];
				newColumn.id = 'colId'+yColsVals[yid];
				newColumn.style.display = 'block';
				newColumn.addEventListener('click',clickLineData);
				newColumn.classList.add('hoverClick');
				document.getElementById('yAxisDataBox').appendChild(newColumn);
				/*if (nsteps == -1) {
					var qstring = 'div[tabulator-field="col'+yColsVals[yid]+'"] div.tabulator-col-title';
					var hEl = headerEls.querySelector(qstring);
					if (hEl){hEl.style.background = '#e6c6e6';}
				}*/
			}
			chgLineTab();
			chgModify();
			document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
		
		}
	}
	else {
		var colChg = false;
		var headerEls = document.querySelector('div.tabulator-headers');
		var headerTitleEls = headerEls.querySelectorAll('div.tabulator-col-title');
		for (var i=0;i<headerTitleEls.length;i++){
			headerTitleEls[i].style.backgroundColor = '#e6e6e6';
		}
		
		var skipRows = [];
		if (document.getElementById('yColsVal').value != ''){
			yColsVals = document.getElementById('yColsVal').value.split(',');
			document.getElementById('yAxisDataBox').innerHTML = '';
			var ycvStr = '';
			
			for (var yid in yColsVals){
				
				yColsVals[yid] = parseInt(yColsVals[yid]);
				if (yColsVals[yid]< headers.length){
					createLineDiv(yColsVals[yid],true);
					ycvStr += yColsVals[yid]+', ';
					var newColumn = document.createElement('span');
					newColumn.textContent = headers[yColsVals[yid]];
					newColumn.id = 'colId'+yColsVals[yid];
					newColumn.style.display = 'block';
					newColumn.addEventListener('click',clickLineData);
					newColumn.classList.add('hoverClick');
					document.getElementById('yAxisDataBox').appendChild(newColumn);
					if (nsteps == -1) {
						var qstring = 'div[tabulator-field="col'+yColsVals[yid]+'"] div.tabulator-col-title';
						var hEl = headerEls.querySelector(qstring);
						if (hEl){hEl.style.background = '#e6c6e6';}
					}
				}
				else {
					colChg = true;
					skipRows.push(yColsVals[yid]);
				}
			}
			chgLineTab();
			document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
			
		
		}
		if (document.getElementById('xColVal').value != ''){
			var xcv = parseInt(document.getElementById('xColVal').value);
			document.getElementById('xColumnSelect').value =  xcv;
			if (xcv < headers.length){
				if (nsteps == -1) {
					var qstring = 'div[tabulator-field="col'+xcv+'"] div.tabulator-col-title';
					var hEl = headerEls.querySelector(qstring);
					if (hEl){hEl.style.background = '#c6e6e6';}
				}
			}
			else {
				document.getElementById('xColVal').value = '';
				colChg = true;
			}
		}
		if (colChg){
			columnsChg();
			for (var i in skipRows){
				var qstring = 'option[value="'+skipRows[i]+'"]';
				console.log(qstring);
				var ell = document.getElementById('lineStyleMenu').querySelector(qstring);
				ell.parentElement.removeChild(ell);
		
				qstring = '#lineStyleDiv'+skipRows[i];
				ell = document.getElementById("yAxisFormatBox").querySelector(qstring);
				ell.parentElement.removeChild(ell);
			}
		}
	}
}

// Change Tab of which line to style
function chgLineTab(){
	
	colid = document.getElementById('lineStyleMenu').querySelector('*:checked').value;

	var el = document.getElementById('colId'+colid);
	if (el){
		el.style.borderColor = 'rgb(200, 200, 200)';
	}
	
	var lineDivs = document.getElementById('yAxisFormatBox').children;
	for (var i=0;i<lineDivs.length;i++){
		if (lineDivs[i].id != 'lineStyleDiv'+colid) {
			lineDivs[i].style.display = 'none';
			var ell = document.getElementById('colId'+lineDivs[i].id.substring(12));
			if (ell){
				ell.style.borderColor = 'white';
			}
		}
		else {
			lineDivs[i].style.display = 'block';
		}
		
	}
	
	
}

//Download from url
function urlChg(url) {
	var url = document.getElementById('dataUrl').value;
	
	var jsonmessage = {'operation':'download','message':url};
	if (url.indexOf('.csv') == url.length-4 || url.indexOf('.tsv') == url.length-4){
	
	}
	else if (url.indexOf('.xls') == url.length-4){
		jsonmessage.type = 'xls';
	}
	else if (url.indexOf('.xlsx') == url.length-5){
		jsonmessage.type = 'xlsx';
	}
	else {
		alert('URL must be csv, tsv, xls, or xlsx');
		return;
		
	}
	ws.send(JSON.stringify(jsonmessage));
}


//Set columns in Create Chart
document.getElementById('yAxisDataBox').innerHTML = '';

// Show table input type
var dataFile = document.getElementById("dataFile");
var dropArea = document.getElementById("dropArea");
var dataCopy = document.getElementById("dataCopy");
var dataUrl = document.getElementById("dataUrl");
dataCopy.style.display = 'none';
dataUrl.style.display = 'none';
function dst() {
	var radioChecked = document.querySelector("select[name=dataSourceType]").value;
	if (radioChecked == 'File'){
		dataFile.style.display = 'inline-block';
		dropArea.style.display = 'block';
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


		
function delimiterChg() {
	delimiter = document.getElementById('delimiter').value;
	var jsonmessage = {'operation':'options','delimiter':delimiter};
	ws.send(JSON.stringify(jsonmessage));
}		
function headerChg() {
	nHeaders = parseInt(document.getElementById('nHeaders').value);
	var jsonmessage = {'operation':'options','nHeaders':nHeaders};
	ws.send(JSON.stringify(jsonmessage));
}
function createLineDiv(id,chg=false) {

	if (chg){
		var el = document.getElementById('lineStyleMenu');
		var qstring = 'option[value="'+id+'"]';
		if (el.querySelector(qstring)) {
			el.querySelector(qstring).textContent = headers[id];
		}
		chgLineTab();
		return
	}

	let template = document.getElementById('yAxisFormat-template');
	let tc = template.content.cloneNode(true);
	let parentEl = document.getElementById('yAxisFormatBox');
	parentEl.appendChild(tc);
	var newEl = parentEl.querySelector('#lineStyleDiv_id');
	newEl.id = 'lineStyleDiv'+id;
	var shapeEls = newEl.querySelectorAll('input[name=shape_id]');
	for (var i=0;i<shapeEls.length;i++){
		shapeEls[i].setAttribute('name','shape'+id);
	}
	newEl.querySelector('select[name=dash_id]').setAttribute('name','dash'+id);

	if (options.lines) {
		for (var i=0;i<options.lines.length;i++){
			if (options.lines[i].id == id){
				if (options.lines[i].name){
					newEl.querySelector('input[name=lineName]').value = options.lines[i].name;
				}
				if (options.lines[i].lineColor){
					newEl.querySelector('input[name=lineColor]').value = options.lines[i].lineColor;
				}
				if (options.lines[i].dotColor){
					newEl.querySelector('input[name=dotColor]').value = options.lines[i].dotColor;
				}
				if (options.lines[i].shape){
					newEl.querySelector('input[value='+options.lines[i].shape+']').checked = true;
				}
				if (options.lines[i].dash){
					newEl.querySelector('select[name=dash'+id+']').value = options.lines[i].dash;
				}
			}
		}
	}
	
	
	
	newEl = document.createElement('option');
	newEl.value = id;
	newEl.textContent = headers[id];
	document.getElementById('lineStyleMenu').appendChild(newEl);
	
	if (document.getElementById("yAxisFormatBox").children.length == 1){
		document.getElementById('lineStyleMenu').value = id;
	}
	
	
	chgLineTab();
}
function columnsChg() {
	var yColsStr = document.getElementById('yColsVal').value;
	var xColStr = document.getElementById('xColVal').value;

	
	var yColumns = [];
	xColumn = '';
	var lineNames = [];
	var noNames = false;
	
	var yCols = yColsStr.split(',');

	for (var i=0;i<yCols.length;i++){
		if (!isNaN(parseInt(yCols[i]))){ 
			yColumns.push(parseInt(yCols[i]));
			if (parseInt(yCols[i])<headers.length){
				lineNames.push({'passive':true,'id':parseInt(yCols[i]),'name':headers[parseInt(yCols[i])]});
			}
			else {
				noNames = true;
			}
			
		}
		
	}
	
	if (!isNaN(parseInt(xColStr))){ 
		xColumn = parseInt(xColStr);
		
	}
	
	headersChanged(false,true);
	var jsonmessage = {'operation':'options','yColumns':yColumns,'xColumn':xColumn};
	if (!noNames){jsonmessage['lines']=lineNames}
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
	else if (optionname == 'scaleX' || optionname == 'scaleY'){
		var newoption = document.querySelector('select[name='+optionname+']').value;
		var jsonmessage = {'operation':'options','scale':{}};
		if (optionname == 'scaleX') {jsonmessage['scale']['x']=newoption;}
		else if (optionname == 'scaleY') {jsonmessage['scale']['y']=newoption;}
		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'dash'){
		var newoption = document.querySelector('select[name='+optionname+']').value;
		var jsonmessage = {'operation':'options'};
		jsonmessage[optionname]=newoption;
		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'dots' || optionname == 'shape'){
		var newoption = document.querySelector('input[name='+optionname+']:checked').value;
		var jsonmessage = {'operation':'options'};
		jsonmessage[optionname]=newoption;
		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'domain' || optionname == 'range' || optionname == 'lineColors'){
		var newoption = document.querySelector('input[name='+optionname+']').value;
		var jsonmessage = {'operation':'options'};
		jsonmessage[optionname]=newoption;
		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'stepSizeX' || optionname == 'stepSizeY'){
		var newoption = document.querySelector('input[name='+optionname+']').value;
		var jsonmessage = {'operation':'options','stepSize':{}};
		if (optionname == 'stepSizeX') {jsonmessage['stepSize']['x']=newoption;}
		else if (optionname == 'stepSizeY') {jsonmessage['stepSize']['y']=newoption;}
		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'lineName'){
		var parentEl = document.querySelector("#lineStyleDiv"+colid);

		var el = parentEl.querySelector('input[name='+optionname+']')
		var newoption = el.value;
		var jsonmessage = {'operation':'options','lines':[{'id':colid}]};

		jsonmessage['lines'][0]['name']=newoption;

		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'lineColor' || optionname == 'dotColor'){
		var parentEl = document.querySelector("#lineStyleDiv"+colid);

		var el = parentEl.querySelector('input[name='+optionname+']')
		var newoption = el.value;
		var jsonmessage = {'operation':'options','lines':[{'id':colid}]};

		jsonmessage['lines'][0][optionname]=newoption;

		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'shapeOne'){
		var parentEl = document.querySelector("#lineStyleDiv"+colid);
		
		var el = parentEl.querySelector('input[name=shape'+colid+']:checked');
		var newoption = el.value;
		var jsonmessage = {'operation':'options','lines':[{'id':colid}]};

		jsonmessage['lines'][0]['shape']=newoption;

		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'dashOne'){
		var parentEl = document.querySelector("#lineStyleDiv"+colid);
		
		var el = parentEl.querySelector('select[name=dash'+colid+']');
		var newoption = el.value;
		var jsonmessage = {'operation':'options','lines':[{'id':colid}]};

		jsonmessage['lines'][0]['dash']=newoption;

		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'tags'){
		var newoption = document.querySelector('*[name='+optionname+']').value;
		var jsonmessage = {'operation':'options'};
		jsonmessage[optionname]=newoption.toLowerCase().replace(/,\s/g,',').replace(/\s/g,'_').split(',');
		console.log(jsonmessage);
		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'viewPermissions' || optionname == 'forkPermissions' || optionname == 'editPermissions'){
		var newoption = document.querySelector('*[name='+optionname+']').value;
		var jsonmessage = {'operation':'permissions'};
		jsonmessage[optionname]=newoption;
		console.log(jsonmessage);
		ws.send(JSON.stringify(jsonmessage));
	}
	else {
		var newoption = document.querySelector('*[name='+optionname+']').value;
		var jsonmessage = {'operation':'options'};
		jsonmessage[optionname]=newoption;
		console.log(jsonmessage);
		ws.send(JSON.stringify(jsonmessage));
	}
}
function chgStep(evt,knownstep=false) {
	var ell = document.getElementById('rawModified');
	var qel = ell.querySelectorAll('a[name]');
	
	if (!knownstep){
		var el = evt.target;
		newnsteps = parseInt(el.getAttribute('name'));
		
		var allyes = document.querySelectorAll('.baf-yes');
		for (var i=0;i<allyes.length;i++){
			allyes[i].classList.remove('baf-yes');
			allyes[i].classList.add('baf-no');
		}
		
		var allnsteps = document.querySelectorAll('div[data-nsteps]')
		for (var i=0;i<allnsteps.length;i++){
			if (newnsteps == -1 || newnsteps >= qel.length -1){
				var toyes = allnsteps[i].querySelectorAll('.baf-no')[2];
				toyes.classList.remove('baf-no');
				toyes.classList.add('baf-yes');
			}
			else if (newnsteps == parseInt(allnsteps[i].getAttribute('data-nsteps')) ){
				var toyes = allnsteps[i].querySelectorAll('.baf-no')[0];
				toyes.classList.remove('baf-no');
				toyes.classList.add('baf-yes');
			}
			else if (newnsteps == parseInt(allnsteps[i].getAttribute('data-nsteps'))+1 ){
				var toyes = allnsteps[i].querySelectorAll('.baf-no')[1];
				toyes.classList.remove('baf-no');
				toyes.classList.add('baf-yes');
			}
		}
	}
	
	for (var i=0;i<qel.length;i++){
		if (i != newnsteps){qel[i].classList.remove('selectedRaw');}
		else {qel[i].classList.add('selectedRaw');}
	}

	if (newnsteps >= qel.length -1){
		newnsteps = -1;
	}
	if (nsteps != newnsteps){
		var jsonmessage = {'operation':'options','nsteps':newnsteps};
		ws.send(JSON.stringify(jsonmessage));
		nsteps = newnsteps;
	}
}
function modifierChanged(save=true) {
	var el = document.getElementById('rawModified');

	var addedRaw = false;
	var idx = 1;
	for (var i in modifiers){
		if (modifiers[i].enabled){
			if (!addedRaw){
				var qel = el.querySelectorAll('a[name="0"]').length;
				if (qel == 0){
					var newEl = document.createElement('a');
					newEl.textContent = 'R';
					newEl.setAttribute('name',0);
					newEl.addEventListener('click',chgStep);
					el.appendChild(newEl);
				}
				addedRaw = true;
			}
			var qel = el.querySelectorAll('a[name="'+idx+'"]').length;
			if (qel == 0){
				var newEl = document.createElement('a');
				newEl.textContent = idx;
				newEl.setAttribute('name',idx);
				newEl.addEventListener('click',chgStep);
				el.appendChild(newEl);
			}
			idx++;
		}
	}
	var qel = el.querySelectorAll('a[name]').length;
	if (qel >= idx){
		for (var i=idx;i<qel+1;i++){
			var qell = el.querySelector('a[name="'+i+'"]');
			if (qell){
				qell.parentNode.removeChild(qell);
			}
		}
	}
	if (save){
		var jsonmessage = {'operation':'modifiers','message':modifiers};
		ws.send(JSON.stringify(jsonmessage));
	}
}

function showLineChartOptions() {
	document.getElementById('xAxisHolder').style.display = 'block';
	document.getElementById('yAxisHolder').style.display = 'block';
}
function typeChg() {
	var isChecked = document.querySelector('#chartTypeMenu > option:checked');
	if (isChecked.value == 'line'){showLineChartOptions();}
	var jsonmessage = {'operation':'options','type':isChecked.value};
	ws.send(JSON.stringify(jsonmessage));
}


function clickTippy(evt) {
	var col = evt.target.parentElement.parentElement.getAttribute('data-col');
	
	if (col){
		var colName = evt.target.parentElement.parentElement.getAttribute('data-name');
		
		if (evt.target.getAttribute('name')=='xButton'){
			document.getElementById('xColumnSelect').value = col;
			addColumn('x');
		}
		else if (evt.target.getAttribute('name')=='yButton'){
			document.getElementById('yColumnSelect').value = col;
			addColumn('y');
		}
		else if (evt.target.getAttribute('name')=='ascButton' || evt.target.getAttribute('name')=='descButton'){
			//Add col to yCols
			var id = Math.random().toString(36).substr(2, 8);
			var idx = modifiers.length-1;
			if (modifiers[idx] && modifiers[idx].type == 'sort'){
				if (modifiers[idx].options.column == parseInt(col)){
					if (!modifiers[idx].options.ascending && evt.target.getAttribute('name')=='ascButton'){
						modifiers[idx].options.ascending = true;
						modifierChanged();
						chgModify(modifiers[idx]);
						updateColumns();
					}
					else if (modifiers[idx].options.ascending && evt.target.getAttribute('name')=='descButton'){
						modifiers[idx].options.ascending = false;
						modifierChanged();
						chgModify(modifiers[idx]);
						updateColumns();
					}
					tippys[col].destroy();
					delete tippys[col];
					return;
				}
			}
			var newObject = {'id':id,'name':'Sort by '+colName,'type':'sort','options':{},'enabled':true};
			newObject.options.column = [parseInt(col),false,false];
			if (evt.target.getAttribute('name')=='ascButton') {
				newObject.options.ascending = [true,true,true];
			}
			else {
				newObject.options.ascending = [false,true,true];
			}
			var el = document.getElementById('createModifyMenu');
			el.style.display = 'none';
			el.value = '';
			createSort(newObject);
			modifiers.push(newObject);
			modifierChanged();
			chgModify(newObject);
			updateColumns();
		}
		else if (evt.target.getAttribute('name')=='pivotButton'){
			//Add col to yCols
			var id = Math.random().toString(36).substr(2, 8);
			var idx = modifiers.length-1;
			if (modifiers[idx] && modifiers[idx].type == 'pivot'){
				if (modifiers[idx].options.pivot == parseInt(col)){
					//modifiers[idx].options.ascending = false;
					modifierChanged(false);
					chgModify(modifiers[idx]);
					updateColumns();
					tippys[col].destroy();
					delete tippys[col];
					return;
				}
			}
			var newObject = {'id':id,'name':'Pivot','type':'pivot','options':{},'enabled':true};
			newObject.options.pivot = parseInt(col);
			newObject.options.columns = [];
			var el = document.getElementById('createModifyMenu');
			el.style.display = 'none';
			el.value = '';
			createPivot(newObject);
			modifiers.push(newObject);
			modifierChanged();
			chgModify(newObject);
			updateColumns();
		}
		else if (evt.target.getAttribute('name')=='deleteButton'){
			table.deleteColumn('col'+col);
			userDataChanges.push({'deleteColumn':parseInt(col)});
			document.getElementById('saveUserChanges').classList.add('savesToMake');
		}
		if(tippys[col]){
			tippys[col].destroy();
			delete tippys[col];
		}
		
	}
	else {
		var row = evt.target.parentElement.parentElement.getAttribute('data-row');
		if (evt.target.getAttribute('name')=='deleteButton'){
			table.deleteRow(row);
			userDataChanges.push({'originalRow':parseInt(row),'newRow':-1});
			document.getElementById('saveUserChanges').classList.add('savesToMake');
		}
		else if (evt.target.getAttribute('name')=='addButton'){
			var rowCount = table.getDataCount();
			table.addRow({id:rowCount,colRow:rowCount},false,row);
			userDataChanges.push({'originalRow':rowCount,'newRow':parseInt(row)+1});
			document.getElementById('saveUserChanges').classList.add('savesToMake');
		}
		
		
		if(tippysR[row]){
			
			tippysR[row].destroy();
			delete tippysR[row];
		}
	}
	
}

function sendUserChanges() {
	var jsonmessage = {'operation':'dataupdate','message':userDataChanges};
	ws.send(JSON.stringify(jsonmessage));
	console.log(userDataChanges);
	userDataChanges = [];
	document.getElementById('saveUserChanges').classList.remove('savesToMake');
}
function updateTable(data,sentHeaders,isPaginate=false) {
	//console.log(sentHeaders);
	var tableColumns = [];
	
	var rowColumn = {};
	rowColumn.title = 'Row';
	rowColumn.field = 'colRow';
	rowColumn.align = 'right';
	rowColumn.rowHandle = true;
	rowColumn.cellClick = function(e, cell){
		var row = cell.getRow()['_row'].data.colRow;
		let templateR = document.getElementById('clickRow-template');
		let tcr = templateR.content.cloneNode(true).firstElementChild;
		tcr.setAttribute('data-row',row);
		
		if (!modifiers || modifiers.length == 0 || nsteps == 0) {
			tcr.querySelector('button[name=deleteButton]').addEventListener('click',clickTippy);
			tcr.querySelector('button[name=addButton]').addEventListener('click',clickTippy);
		}
		else {
			tcr.querySelector('button[name=deleteButton]').style.display = 'none';
			tcr.querySelector('button[name=addButton]').style.display = 'none';
		}
		if (!modifiers || modifiers.length == 0 || nsteps == -1 ){
			tcr.querySelector('button[name=filterButton]').addEventListener('click',clickTippy);
		}
		else {
			tcr.querySelector('button[name=filterButton]').style.display = 'none';
		}
			
		if (!tippysR[row]){
			let mytippy = tippy(e.target, {
			  content: tcr,
			  appendTo: document.querySelector('.header'),
			  trigger: 'manual',
			  interactive: true,
			  placement: 'left',
			  onHidden(instance){tippysR[row].destroy(); delete tippysR[row];}
			});
			tippysR[row] = mytippy;
			mytippy.show();
		}

	}
	/*rowColumn.headerClick = function(e, column){
		if (!tippysR[-1]){
			let templateR = document.getElementById('clickRow-template');
			var tcr = document.createElement('div');
			tcr.setAttribute('data-row',-1);
			var newDiv = document.createElement('div');
			var newA = document.createElement('a');
			newA.textContent = 'Rearrange Rows';
			newA.addEventListener('click',clickTippy);
			newDiv.appendChild(newA);
			newA = document.createElement('a');
			newA.textContent = 'Add Row';
			newA.addEventListener('click',clickTippy);
			newDiv.appendChild(newA);
			tcr.appendChild(newDiv);
				
			let mytippy = tippy(e.target, {
			  content: tcr,
			  appendTo: document.querySelector('.header'),
			  trigger: 'manual',
			  interactive: true,
			  placement: 'left',
			});
			tippysR[-1] = mytippy;
			mytippy.show();
		}
		else {
			tippysR[-1].show();
		}
	}*/
	tableColumns[0] = rowColumn;
	var movableRows = false;
	var movableColumns = false;
	for (var i=0;i<sentHeaders.headers.length;i++){

		var thisColumn = {};
		thisColumn.title = sentHeaders.headers[i];
		thisColumn.field = 'col'+i;
		if (sentHeaders.types[i] && sentHeaders.types[i] == 'S'){
			thisColumn.align = 'left';
		}
		else {
			thisColumn.align = 'right';
		}
		thisColumn.headerClick = function(e, column){
			var col = column['_column'].field.substring(3);
			let template = document.getElementById('clickColumn-template');
			let tc = template.content.cloneNode(true).firstElementChild;
			tc.setAttribute('data-col',col);
			tc.setAttribute('data-name',headers[parseInt(col)]);
			if (!modifiers || modifiers.length == 0 || nsteps == 0) {
				tc.querySelector('button[name=deleteButton]').addEventListener('click',clickTippy);
			}
			else {
				tc.querySelector('button[name=deleteButton]').style.display = 'none';
			}
			if (!modifiers || modifiers.length == 0 || nsteps == -1 ){
				tc.querySelector('button[name=xButton]').addEventListener('click',clickTippy);
				tc.querySelector('button[name=yButton]').addEventListener('click',clickTippy);
				tc.querySelector('button[name=pivotButton]').addEventListener('click',clickTippy);
				tc.querySelector('button[name=ascButton]').addEventListener('click',clickTippy);
				tc.querySelector('button[name=descButton]').addEventListener('click',clickTippy);
			}
			else {
				tc.querySelector('button[name=xButton]').style.display = 'none';
				tc.querySelector('button[name=yButton]').style.display = 'none';
				tc.querySelector('button[name=pivotButton]').style.display = 'none';
				tc.querySelector('button[name=ascButton]').style.display = 'none';
				tc.querySelector('button[name=descButton]').style.display = 'none';
			}
			
			
			if (!tippys[col]){
				let mytippy = tippy(e.target, {
				  content: tc,
				  appendTo: document.querySelector('.header'),
				  trigger: 'manual',
				  interactive: true,
				  placement: 'bottom',
				  onHidden(instance){tippys[col].destroy(); delete tippys[col];}
				});
				tippys[col] = mytippy;
				mytippy.show();
			}
		}
		if (!modifiers || modifiers.length == 0 || nsteps == 0){
			thisColumn.editor = 'input';
			movableRows = true;
			movableColumns = true;
		}
		tableColumns.push(thisColumn);
	
	}
	var tableData = [];
	var includeHeaders = false;
	var ajaxProgressiveLoad = 'scroll';
	var pagination = false;
	if (data){
		for (var i=0;i<data.length;i++){
			var newDataRow = {id:i,colRow:i};
		
			for (var ii=0;ii<data[i].length;ii++){
				newDataRow['col'+ii]=data[i][ii];
			}
			tableData.push(newDataRow);
		
		}
		initialData = tableData.slice(0,500);
	}
	else if (isPaginate){
		ajaxProgressiveLoad = false;
		pagination = "remote";
	}
	var dataTable = document.getElementById("dataTableModified");
	if (document.getElementById("dataTableOverlay")){
		document.getElementById("dataTableOverlay").style.display = 'none';
	}
	dataTable.innerHTML = '';
	
	var redrawnow = true;
	table = new Tabulator("#dataTableModified", {
		ajaxURL:"placeholder",
		paginationSize:100,
		ajaxProgressiveLoad: ajaxProgressiveLoad,
		pagination: pagination,
		ajaxProgressiveLoadScrollMargin:300,
		ajaxRequestFunc:queryRealm,
		columns: tableColumns,
		autoResize:true,
		movableRows:movableRows,
		movableColumns:movableColumns,
		height:"90%",
		headerSort: false,
		layout:"fitData",
		layoutColumnsOnNewData:true,
		cellEdited:function(cell){
			var row = cell['_cell'].row.data.colRow;
			var col = cell['_cell'].column.field;
			var value = cell['_cell'].value;
			userDataChanges.push({'row':row,'col':col,'value':value});
			document.getElementById('saveUserChanges').classList.add('savesToMake');
		},
		rowMoved:function(row){
			var originalRow = row['_row'].data.id;
			var newRow = row.getPosition();
			userDataChanges.push({'originalRow':originalRow,'newRow':newRow});
			document.getElementById('saveUserChanges').classList.add('savesToMake');
		},
		columnMoved:function(column, columns){
			var originalColumn = column['_column'].field.substring(3);
			var newColumn = column['_column'];
			var myColumns = [];
			for (var i=0;i<columns.length;i++){
				var field = columns[i]['_column'].field;
				if (field && field != 'colRow'){
					myColumns.push(parseInt(field.substring(3)));
				}
			}
			userDataChanges.push({'newColumns':myColumns});
			document.getElementById('saveUserChanges').classList.add('savesToMake');
		},
		renderComplete:function(){
			
			if (this.tableWidth && this.options.layout == 'fitData'){
				var el = document.querySelector('div.tabulator-tableHolder');
				var scrollWidth = 17;
				if (el.offsetWidth && el.clientWidth){
					if (el.offsetWidth > el.clientWidth){
						scrollWidth = parseInt(el.offsetWidth) - parseInt(el.clientWidth) + 2;
					}
				}
				var nWidth = this.tableWidth + scrollWidth;
				document.getElementById("dataTableModified").style.width = nWidth+'px';
			}
			if (redrawnow){
				redrawnow = false;
				document.getElementById("dataTableModified").style.width = '';
				this.redraw(true);
			}
			
    	},
    	dataLoaded:function(){
    		redrawnow = true;
		},
    	//data: tableData.slice(0,1000),
	});
	dataTable.style.width = '';
	table.redraw(true);
	
}
function queryRealm(url, config, params){

    return new Promise(function(resolve, reject){
        //do some async data retrieval then pass the array of row data back into Tabulator
        //ws request data
        if (params.page > 5 || firstPaginate){
        	firstPaginate = false;
			var jsonmessage = {'operation':'data','size':params.size,'page':params.page};
			console.log(jsonmessage);
			ws.send(JSON.stringify(jsonmessage));
			var offset = (params.page-1)*params.size;
			ws.addEventListener('message', function (evt) {
				var dm;
				if (evt.data[0]=='{'){
					dm = JSON.parse(evt.data);
				}
				if (dm.operation == 'data' && dm.page == params.page){
					var returnData = {};
					returnData["last_page"]=dm.lastPage;
					returnData["data"]=[];
				
					for (var i=offset;i<offset+dm.data.length;i++){
						var newDataRow = {id:i,colRow:i};
						for (var ii=0;ii<dm.data[i-offset].length;ii++){
							newDataRow['col'+ii]=dm.data[i-offset][ii];
						}
						returnData["data"].push(newDataRow);
		
					}
					
					resolve(returnData);
				}
			});
		
			setTimeout(function(){ reject(); }, 5000);
		}
		else {
			var returnData = {
				"last_page":10, //the total number of available pages (this value must be greater than 0)
				"data":initialData.slice(params.page*params.size-params.size,params.page*params.size),
			}
			
			resolve(returnData);
		}

        
    });
}
function redrawTable() {
	var dataTable = document.getElementById("dataTableModified");
	dataTable.style.width = '';
	if (table){table.redraw(true);}
	if (document.getElementById("dataTableOverlay")){
		document.getElementById("dataTableOverlay").style.display = 'none';
	}
	
}
function gotoPaginate(){
	if (table && table.options.pagination == false){
		table.destroy();
		firstPaginate = true;
		document.getElementById('paginationButton').textContent = 'Scroll';
		updateTable(false,allHeaders.modified,'paginate');
	}
	else if (table) {
		table.destroy();
		firstPaginate = true;
		document.getElementById('paginationButton').textContent = 'Pagination';
		updateTable(false,allHeaders.modified);
	}
}

function dataChanged(csv='',dataType='csv') {
	var isString = false;
	if (csv == ''){
		csv = dataCopy.value;
		var compbase64 = pako.deflate(csv,{to:'string'});
		csv = btoa(compbase64);
		isString = true;
	}
	minimizedBoxes['dataSource'] == 'large';
	minimizeBox('dataSource');
	var d = new Date(); var n = d.getTime(); console.log('time: ', n);
	var jsonmessage = {'operation':'upload','message':csv,'isString':isString};
	if (dataType != 'csv'){
		jsonmessage.type = dataType;
	}
	ws.send(JSON.stringify(jsonmessage));



}



//Dragula with column choices
function addColumn(t){

	if (t == 'x'){
		document.getElementById('xColVal').value = document.getElementById('xColumnSelect').value;
		columnsChg();
	}
	else if (t == 'y'){
		var id = document.getElementById('yColumnSelect').value;
		var ycvStr = '';
		for (var yid in yColsVals){
			ycvStr += yColsVals[yid]+', ';
		}
		createLineDiv(id);
		yColsVals.push(id);
		ycvStr += id+', ';

		document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
		columnsChg();
		document.getElementById('lineStyleMenu').value = id;
		chgLineTab();
		
	}
}
var drake = dragula([document.getElementById('yAxisDataBox')], {
  copy: function (el, source) {
    return false;
  },
  accepts: function (el, target, source) {
  	if (target === source || target.id === 'xColumn'){return true;}
  	for (var yid in yColsVals){
  		if ('colId'+yColsVals[yid] == el.id){return false;}
  	}
  	return true;
    
  },
  removeOnSpill: function (el, source) {
    return true;
  }
});

drake.on('drop', function (el, target, source, sibling) { 
	var d = new Date(); var n = d.getTime(); console.log('timedrop1: ', n);
	if (target.id == 'yAxisDataBox') {
		var elid = el.id.substring(5);
		
		
		var ycvStr = '';
		var oldId = -1;
		var newId = -1
		for (var yid in yColsVals){
			if (elid == yColsVals[yid]){
				oldId = yid;
			}
			else if (!sibling){
				ycvStr += yColsVals[yid]+', ';
			}
		}
		if (oldId != -1){
			yColsVals.splice(oldId,1);
		}
		else {
			createLineDiv(elid);
		}
		
		
		if (!sibling){
			
			newId = yColsVals.length;
			yColsVals.push(elid);
			ycvStr += elid+', ';

		}
		else {
			
			var sibid = sibling.id.substring(5);
			for (var yid in yColsVals){
				if (sibid == yColsVals[yid]) {
					newId = yid;
					ycvStr += elid+', ';
					ycvStr += yColsVals[yid]+', ';
				}
				else {
					ycvStr += yColsVals[yid]+', ';
				}
			}
			yColsVals.splice(newId,0,elid);
		}
		document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
		columnsChg();
		
		document.getElementById('lineStyleMenu').value = elid;
		chgLineTab();
		
	}
	d = new Date(); n = d.getTime(); console.log('timedrop2: ', n);
});
drake.on('remove', function (el, target, source) { 
	var d = new Date(); var n = d.getTime(); console.log('timeremove1: ', n);
	if (source.id == 'yAxisDataBox') {
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
		var qstring = 'option[value="'+el.id.substring(5)+'"]';
		var ell = document.getElementById('lineStyleMenu').querySelector(qstring);
		ell.parentElement.removeChild(ell);
		
		qstring = '#lineStyleDiv'+el.id.substring(5);
		ell = document.getElementById("yAxisFormatBox").querySelector(qstring);
		ell.parentElement.removeChild(ell);
	}
	d = new Date(); n = d.getTime(); console.log('timeremove2: ', n);
});
drake.on('drag', function (el, target, source) { 
	var d = new Date(); n = d.getTime(); console.log('start drG: ', n);
	var elval = el.id.substring(5);
	document.getElementById('lineStyleMenu').value = elval;
	d = new Date(); n = d.getTime(); console.log('mid drG: ', n);
	chgLineTab();
	d = new Date(); n = d.getTime(); console.log('end drG: ', n);
});
function clickLineData(evt) {
	var elval = evt.target.id.substring(5);
	console.log(elval);
	document.getElementById('lineStyleMenu').value = elval;
	chgLineTab();
}




function updateColumns(id='all') {
	for (var i in modifiers){
		if (id=='all' || modifiers[i].id == id){
			if (modifiers[i].type == 'new' || modifiers[i].type == 'filter'){
				var el = document.getElementById('newcolVar'+modifiers[i].id);
				var elval = el.value;
				el.innerHTML = '';
				var cols = allHeaders[modifiers[i].id];
				var varOption = document.createElement('option');
				varOption.value = -1;
				varOption.textContent = 'Row #';
				if (-1 == parseInt(elval)){
					varOption.setAttribute('selected','selected');
				}
				el.appendChild(varOption);
				for (var ii in cols){
					var varOption = document.createElement('option');
					varOption.value = parseInt(ii);
					varOption.textContent = cols[parseInt(ii)];
					if (parseInt(ii) == parseInt(elval)){
						varOption.setAttribute('selected','selected');
					}
					el.appendChild(varOption);
				}
				var allVars = el.parentElement.parentElement.querySelector('#allVariables');
				for (var ii in modifiers[i].options.variables){
					var objVar = modifiers[i].options.variables[ii];
					var qstring = 'div[name='+ii+']';
					var newEl = allVars.querySelector(qstring);
					if (cols && objVar){
						if (objVar.column == -1){
							newEl.textContent = ii + ' := Row #';
						}
						else {
							newEl.textContent = ii + ' := ' + objVar.type + ' of ' + cols[objVar.column];
						}
					}
					var rowStr = toRowStr(objVar);
					newEl.textContent += rowStr;
				}
				
			
			}
			else if (modifiers[i].type == 'replace'){
				var el = document.getElementById('replaceCol'+modifiers[i].id);
				var elval = el.getAttribute('value');
				console.log(elval);
				el.innerHTML = '';
				var cols = allHeaders[modifiers[i].id];
				for (var ii in cols){
					var varOption = document.createElement('option');
					varOption.value = parseInt(ii);
					varOption.textContent = cols[parseInt(ii)];
					if (parseInt(ii) == parseInt(elval)){
						varOption.setAttribute('selected','selected');
					}
					el.appendChild(varOption);
				}
				
			
			}
			else if (modifiers[i].type == 'sort'){
				var el = document.getElementById('sortcol1_'+modifiers[i].id);
				var elval = modifiers[i].options.column[0];
				el.innerHTML = '';
				var cols = allHeaders[modifiers[i].id];
				for (var ii in cols){
					var varOption = document.createElement('option');
					varOption.value = parseInt(ii);
					varOption.textContent = cols[parseInt(ii)];
					if (parseInt(ii) == parseInt(elval)){
						varOption.setAttribute('selected','selected');
					}
					el.appendChild(varOption);
				}
				var el = document.getElementById('sortcol2_'+modifiers[i].id);
				var elval = modifiers[i].options.column[1];
				el.innerHTML = '';
				var cols = allHeaders[modifiers[i].id];
				for (var ii in cols){
					var varOption = document.createElement('option');
					varOption.value = parseInt(ii);
					varOption.textContent = cols[parseInt(ii)];
					if (parseInt(ii) == parseInt(elval)){
						varOption.setAttribute('selected','selected');
					}
					el.appendChild(varOption);
				}
				var el = document.getElementById('sortcol3_'+modifiers[i].id);
				var elval = modifiers[i].options.column[2];
				el.innerHTML = '';
				var cols = allHeaders[modifiers[i].id];
				for (var ii in cols){
					var varOption = document.createElement('option');
					varOption.value = parseInt(ii);
					varOption.textContent = cols[parseInt(ii)];
					if (parseInt(ii) == parseInt(elval)){
						varOption.setAttribute('selected','selected');
					}
					el.appendChild(varOption);
				}
			}
			else if (modifiers[i].type == 'pivot'){
			var el = document.getElementById('pivotcol'+modifiers[i].id);
			var elval = modifiers[i].options.pivot;
			el.innerHTML = '';
			var cols = allHeaders[modifiers[i].id];
			for (var ii in cols){
				var varOption = document.createElement('option');
				varOption.value = parseInt(ii);
				varOption.textContent = cols[parseInt(ii)];
				if (parseInt(ii) == parseInt(elval)){
					varOption.setAttribute('selected','selected');
				}
				el.appendChild(varOption);
				
			}
			el = document.getElementById('colcol'+modifiers[i].id);
			var elval = el.val;
			el.innerHTML = '';
			var cols = allHeaders[modifiers[i].id];
			for (var ii in cols){
				var varOption = document.createElement('option');
				varOption.value = parseInt(ii);
				varOption.textContent = cols[parseInt(ii)];
				if (parseInt(ii) == parseInt(elval)){
					varOption.setAttribute('selected','selected');
				}
				el.appendChild(varOption);
			}
			var ell = el.parentElement.querySelector('.pivotColumns').children;
			for (var ii=0;ii<ell.length;ii++){
				var col = parseInt(ell[ii].getAttribute('data-col'));
				var type = ell[ii].getAttribute('data-type');
				if (cols){
					ell[ii].textContent = type + ' of ' + cols[col];
				}
			}
		}
		}
	}
}

function toKatex(input_str){
	input_str = input_str.replace(/\sAND\s/gi,'\\text{ and }');
	input_str = input_str.replace(/\sOR\s/gi,'\\text{ or }');
	var openpar = [false,false,false];
	var i = 0;
	var c = input_str.charAt(i);
	while(c != ''){
		var t = -1;
		if (c =='"'){
			t = 0;
		}
		if (c =="'"){
			t = 1;
		}
		if (c =='`'){
			t = 2;
		}
		
		if (t > -1){
			if (!openpar[0] && !openpar[1] && !openpar[2]){
				input_str = input_str.substring(0,i)+"\\text{"+input_str.substring(i+1);
				openpar[t] = true;
			}
			else if (openpar[t]){
				input_str = input_str.substring(0,i)+"}"+input_str.substring(i+1);
				openpar[t] = false;
			}
		}
		
		i++;
		c = input_str.charAt(i);
	}
	return input_str;
}
function updateNsteps(evt,id='',pm=0) {
	if (!evt){// Here when modifier is opened/closed pm=0 is pivot,pm=1 if not
		if (!id){// modifier was closed
			newnsteps = -1;
			chgStep(evt,true);
			return;
		}
		console.log(id,pm);
		var el = document.getElementById('edit'+id);
		var allyes = el.querySelectorAll('.baf-yes');
		for (var i=0;i<allyes.length;i++){
			allyes[i].classList.remove('baf-yes');
			allyes[i].classList.add('baf-no');
		}
		var allno = el.querySelectorAll('.baf-no');
		if (pm ==0){
			allno[0].classList.add('baf-yes');
			allno[0].classList.remove('baf-no');
		}
		else {
			allno[1].classList.add('baf-yes');
			allno[1].classList.remove('baf-no');
		}
		
		
		var cnsteps = 0;
		for (var i in modifiers){
			if (modifiers[i].id == id){
				el.setAttribute('data-nsteps',cnsteps);
				newnsteps = cnsteps+pm;
				chgStep(evt,true);
				break;
			}
			else if (modifiers[i].enabled) {
				cnsteps++;
			}
		}
		return;
	}
	var el = evt.target;
	if (el.tagName == 'I'){
		el = el.parentElement;	
	}
	var id = el.parentElement.parentElement.id;

	var others = el.parentElement.querySelectorAll('.baf-yes');
	for (var i=0;i<others.length;i++){
		others[i].classList.remove('baf-yes');
		others[i].classList.add('baf-no');
	}
	el.classList.add('baf-yes');
	el.classList.remove('baf-no');

	if (el.getAttribute('name')=='final'){
		newnsteps = -1;
		chgStep(evt,true);
		return;
	}
	
	if (!id || id.substring(0,4) != 'edit'){
		id = el.parentElement.parentElement.parentElement.id;
	}
	if (!id || id.substring(0,4) != 'edit'){
		id = el.parentElement.parentElement.parentElement.parentElement.id;
	}
	if (!id || id.substring(0,4) != 'edit'){
		id = el.parentElement.parentElement.parentElement.parentElement.parentElement.id;
	}
	if (el.getAttribute('name') == null || el.getAttribute('name') == ''){
		el = el.parentElement;
	}
	var cnsteps = 0;
	for (var i in modifiers){
		if ('edit'+modifiers[i].id == id){
			newnsteps = cnsteps;
			if (el.getAttribute('name') == 'after'){
				newnsteps++;
			}
			chgStep(evt,true);
			break;
		}
		else if (modifiers[i].enabled) {
			cnsteps++;
		}
	}
}
function updateModifier(evt){
	var id = evt.target.parentElement.parentElement.id;
	var el = evt.target;
	if (!id || id.substring(0,4) != 'edit'){
		id = evt.target.parentElement.parentElement.parentElement.id;
	}
	if (!id || id.substring(0,4) != 'edit'){
		id = evt.target.parentElement.parentElement.parentElement.parentElement.id;
	}
	if (!id || id.substring(0,4) != 'edit'){
		id = evt.target.parentElement.parentElement.parentElement.parentElement.parentElement.id;
	}
	if (el.getAttribute('name') == null || el.getAttribute('name') == ''){
		el = evt.target.parentElement;
	}
	console.log(id);
	for (var i in modifiers){
		if ('edit'+modifiers[i].id == id){
			var mType = modifiers[i].type;
			if (el.getAttribute('name')=='delete'){
				
				//delete from modifiers list
				var listEl = document.getElementById(modifiers[i].id);
				document.getElementById('allModifiers').removeChild(listEl);
				//delete edit element
				var ell = el.parentElement.parentElement;
				ell.parentElement.removeChild(ell);
				//remove from database
				modifiers.splice(i,1);
				modifierChanged();
				return;
			}
			else if (el.getAttribute('name')=='disable'){
				modifiers[i].enabled = false;
				el.textContent = 'Enable';
				el.setAttribute('name','enable');
				
				var listEl = document.getElementById(modifiers[i].id);
				listEl.style.textDecoration = 'line-through';
				listEl.style.color = 'rgb(50,50,50)';
				modifierChanged();
				return;
			}
			else if (el.getAttribute('name')=='enable'){
				modifiers[i].enabled = true;
				el.textContent = 'Disable';
				el.setAttribute('name','disable');
				
				var listEl = document.getElementById(modifiers[i].id);
				listEl.style.textDecoration = 'none';
				listEl.style.color = 'inherit';
				modifierChanged();
				return;
			}
			
			var saveModifier = true;
			if (mType == 'pivot'){
				if (el.getAttribute('name')=='pType'){
					//modifiers[i].options.type = evt.target.querySelector('option:checked').value;
				}
				else if (el.getAttribute('name')=='pivot'){
					modifiers[i].options.pivot = parseInt(el.value);
				}
				else if (el.getAttribute('name')=='edit'){
					var col = el.getAttribute('data-col');
					var type = el.getAttribute('data-type');
					//Do something?
				}
				else if (el.getAttribute('name')=='add'){
					var pType = el.parentElement.querySelector('select[name=pType] > option:checked').value;
					var column = parseInt(el.parentElement.querySelector('select[name="column"]').value);
					var obj = {'column':column,'type':pType};
					modifiers[i].options.columns.push(obj);
					var newEl = document.createElement('div');
					newEl.textContent = pType + ' of ' + column;
					if (allHeaders[modifiers[i].id] && allHeaders[modifiers[i].id][parseInt(column)]){
						newEl.textContent = pType + ' of ' + allHeaders[modifiers[i].id][parseInt(column)];
					}
					newEl.addEventListener('click',updateModifier);
					newEl.classList.add('hoverClick');
					newEl.setAttribute('name','edit');
					newEl.setAttribute('data-col',obj.column);
					newEl.setAttribute('data-type',obj.type);
					el.parentElement.querySelector('div.pivotColumns').appendChild(newEl);
				}
			}
			else if (mType == 'sort'){
				if (el.getAttribute('name')=='column1'){
					modifiers[i].options.column[0] = parseInt(el.value);
					modifiers[i].name = 'Sort by ' + el.querySelector('option:checked').textContent;
					document.getElementById(modifiers[i].id).textContent = 'Sort by ' + el.querySelector('option:checked').textContent;
				}
				else if (el.getAttribute('name')=='descending1'){
					modifiers[i].options.ascending[0] = !el.checked;
				}
				else if (el.getAttribute('name')=='column2'){
					modifiers[i].options.column[1] = parseInt(el.value);
					modifiers[i].name = 'Sort by ' + el.querySelector('option:checked').textContent;
					document.getElementById(modifiers[i].id).textContent = 'Sort by ' + el.querySelector('option:checked').textContent;
				}
				else if (el.getAttribute('name')=='descending2'){
					modifiers[i].options.ascending[1] = !el.checked;
				}
				else if (el.getAttribute('name')=='column3'){
					modifiers[i].options.column[2] = parseInt(el.value);
					modifiers[i].name = 'Sort by ' + el.querySelector('option:checked').textContent;
					document.getElementById(modifiers[i].id).textContent = 'Sort by ' + el.querySelector('option:checked').textContent;
				}
				else if (el.getAttribute('name')=='descending3'){
					modifiers[i].options.ascending[2] = !el.checked;
				}
			}
			else if (mType == 'replace'){
				saveModifier = false;
				if (el.getAttribute('name')=='submit'){
					saveModifier = true;
					var newObj = {};
					var pel = el.parentElement.parentElement;
					newObj.find = pel.querySelector('*[name=find]').value;
					newObj.replace = pel.querySelector('*[name=replace]').value;
					var col = parseInt(pel.querySelector('*[name=column] > option:checked').value);
					newObj.column = col;
					pel.querySelector('*[name=column]').setAttribute('value',col);
					var row = pel.querySelector('*[name=row]').value;
					if (isNaN(parseInt(row))){ row = -1;}
					newObj.row = parseInt(row);
					newObj.case = pel.querySelector('*[name=case]').checked;
					newObj.numerical = pel.querySelector('*[name=numerical]').checked;
					newObj.full = pel.querySelector('*[name=full]').checked;
					if (pel.getAttribute('data-id') && pel.getAttribute('data-id') != ''){
						modifiers[i].options[parseInt(pel.getAttribute('data-id'))] = newObj;
						var newMM = pel.parentElement.querySelector('div[name=allReplacements]');
						toReplaceElement(newObj,parseInt(pel.getAttribute('data-id')),newMM);
						var textEl = newMM.querySelector('div[data-id="'+parseInt(pel.getAttribute('data-id'))+'"]');
						if (textEl){textEl.style.backgroundColor = '';}
						pel.setAttribute('data-id','');
						
						
					}
					else {
						modifiers[i].options.push(newObj);
						var newMM = pel.parentElement.querySelector('div[name=allReplacements]');
						toReplaceElement(newObj,'',newMM);
					}
					//Clear options
					pel.querySelector('input[name=find]').value = '';
					pel.querySelector('input[name=replace]').value = '';
					pel.querySelector('input[name=numerical]').checked = false;
					pel.querySelector('input[name=case]').checked = false;
					pel.querySelector('input[name=full]').checked = false;
					pel.querySelector('select[name=column]').value = 0;
					pel.querySelector('select[name=column] > option:checked').removeAttribute('selected');
					pel.querySelector('input[name=row]').value = '';
					
					
				}
			}
			else if (mType == 'new' || mType == 'filter'){
				saveModifier = true; //Why not auto update?
				if (el.getAttribute('name')=='save'){
					saveModifier = true;
				}
				else if (el.getAttribute('name')=='formula'){
					
					modifiers[i].options.formula = el.value;
					var ell = el.parentElement.querySelector('div[name=katex]');
					katex.render(toKatex(el.value), ell, {
						throwOnError: false
					});
				}
				else if (el.getAttribute('name')=='exclude'){
					if (el.checked && el.value == 'exclude'){
						modifiers[i].options.exclude = true;
					}
					else if (!el.checked && el.value == 'include') {
						modifiers[i].options.exclude = true;
					}
					else {
						modifiers[i].options.exclude = false;
					}
					
				}
				else if (el.getAttribute('data-type')=='showVar'){
					var varName = el.getAttribute('name');
					var ell = el.parentElement.parentElement.querySelector('#newVariables');
					for (var ii in modifiers[i].options.variables){
						if (ii == varName){
							ell.querySelector('input[name=varname]').value = varName;
							ell.querySelector('select[name=type]').value = modifiers[i].options.variables[ii].type;
							ell.querySelector('select[name=column]').value = modifiers[i].options.variables[ii].column;
							//update row stuff
							var id = modifiers[i].id;
							if (modifiers[i].options.variables[ii].type == 'value'){
								var qstring = '#currentRow'+id;
								if ( modifiers[i].options.variables[ii].row.indexOf('$') == 0){
									qstring = '#equalRow'+id;
									ell.querySelector('input[name=equalrow]').value = modifiers[i].options.variables[ii].row.substring(1);
								}
								else if ( modifiers[i].options.variables[ii].row.indexOf('-') == 0){
									qstring = '#previousRow'+id;
									ell.querySelector('input[name=prevn]').value = modifiers[i].options.variables[ii].row.substring(1);
								}
								else if ( modifiers[i].options.variables[ii].row != '0'){
									qstring = '#nextRow'+id;
									ell.querySelector('input[name=aftern]').value = modifiers[i].options.variables[ii].row;
								}
								ell.querySelector(qstring).checked = true;
								ell.querySelector('#value'+id).style.display = 'block';
								ell.querySelector('#group'+id).style.display = 'none';
							}
							else {
								var qstring = '';
								var rows = modifiers[i].options.variables[ii].row.split(',');
								if (rows.length < 2){break;}
								if ( rows[0].indexOf('$') == 0){
									qstring = '#equalRowstart'+id;
									ell.querySelector('input[name=equalrowstart]').value = rows[0].substring(1);
								}
								else if ( rows[0].indexOf('-') == 0){
									qstring = '#previousRowstart'+id;
									ell.querySelector('input[name=prevnstart]').value = rows[0].substring(1);
								}
								else {
									qstring = '#nextRowstart'+id;
									ell.querySelector('input[name=afternstart]').value = rows[0];
								}
								ell.querySelector(qstring).checked = true;
								if ( rows[1].indexOf('$') == 0){
									qstring = '#equalRowend'+id;
									ell.querySelector('input[name=equalrowend]').value = rows[1].substring(1);
								}
								else if ( rows[1].indexOf('-') == 0){
									qstring = '#previousRowend'+id;
									ell.querySelector('input[name=prevnend]').value = rows[1].substring(1);
								}
								else {
									qstring = '#nextRowend'+id;
									ell.querySelector('input[name=afternend]').value = rows[1];
								}
								ell.querySelector(qstring).checked = true;
								ell.querySelector('#value'+id).style.display = 'none';
								ell.querySelector('#group'+id).style.display = 'block';
							}
							
							break;
						}
					}
				} //This doesnt change modifiers
				else if (el.getAttribute('name')=='type'){
					console.log('world');
					if (el.value != 'value') {
						document.getElementById('group'+modifiers[i].id).style.display = 'block';
						document.getElementById('value'+modifiers[i].id).style.display = 'none';
					}
					else {
						document.getElementById('group'+modifiers[i].id).style.display = 'none';
						document.getElementById('value'+modifiers[i].id).style.display = 'block';
					}
					return;
					
				} //This doesnt change modifiers
				else if (el.getAttribute('name')=='name'){
					modifiers[i].name = el.value;
					el.parentElement.parentElement.parentElement.parentElement.querySelector('span[name=title]').textContent = el.value;
				}
				else if (evt.target.getAttribute('name')=='add'){
					var ell = el.parentElement;
					var col = ell.querySelector('select[name=column] > option:checked').value;
					var type = ell.querySelector('select[name=type] > option:checked').value;
					var row = '0';
					if (type =='value'){
						var rowtype = ell.querySelector('input[name=row'+modifiers[i].id+']:checked').value;
						if (rowtype == 'previous'){row = '-'+parseInt(ell.querySelector('input[name=prevn]').value).toString();}
						else if (rowtype == 'next'){row = ell.querySelector('input[name=aftern]').value.toString();}
						else if (rowtype == 'equal'){row = '$'+parseInt(ell.querySelector('input[name=equalrow]').value).toString();}
					}
					else {
						var rowtype = ell.querySelector('input[name=rowstart'+modifiers[i].id+']:checked').value;
						if (rowtype == 'previous'){row = '-'+parseInt(ell.querySelector('input[name=prevnstart]').value).toString();}
						else if (rowtype == 'next'){row = ell.querySelector('input[name=afternstart]').value.toString();}
						else if (rowtype == 'equal'){row = '$'+parseInt(ell.querySelector('input[name=equalrowstart]').value).toString();}
						
						rowtype = ell.querySelector('input[name=rowend'+modifiers[i].id+']:checked').value;
						if (rowtype == 'previous'){row += ',-'+parseInt(ell.querySelector('input[name=prevnend]').value).toString();}
						else if (rowtype == 'next'){row += ','+ell.querySelector('input[name=afternend]').value.toString();}
						else if (rowtype == 'equal'){row += ',$'+parseInt(ell.querySelector('input[name=equalrowend]').value).toString();}
					}
					var newVariable = {'column':parseInt(col),'type':type,'row':row};
					var name = ell.querySelector('input[name=varname]').value;
					modifiers[i].options.variables[name] = newVariable;
					
					var elll = ell.parentElement.querySelector('#allVariables');
					var elllc = elll.children;
					var elExists = false;
					for (var ii=0;ii<elllc.length;ii++){
						if (elllc[ii].getAttribute('name') == name){
							elExists = true;
							break;
						}
					}
					if (!elExists){
						var newEl = document.createElement('div');
						newEl.setAttribute('name',name);
						newEl.setAttribute('data-type','showVar');
						newEl.addEventListener('click',updateModifier);
						newEl.classList.add('hoverClick');
						elll.appendChild(newEl);
					}
					updateColumns(modifiers[i].id);
					
				}
				else if (evt.target.getAttribute('name')=='clear'){
					var ell = el.parentElement;
					var nameEl = ell.querySelector('input[name=varname]');
					var name = nameEl.value;
					nameEl.value = '';
					ell.querySelector('select[name=type]').value = 'value';
					var id = modifiers[i].id;
					ell.querySelector('#newcolVar'+id).value = '0';
					ell.querySelector('#value'+id).style.display = 'block';
					ell.querySelector('#group'+id).style.display = 'none';
					ell.querySelector('#currentRow'+id).checked = true;
					delete modifiers[i].options.variables[name];
					
					var elll = ell.parentElement.querySelector('#allVariables');
					var elllc = elll.children;
					for (var ii=0;ii<elllc.length;ii++){
						if (elllc[ii].getAttribute('name') == name){
							elll.removeChild(elllc[ii])
							break;
						}
					}
					console.log(id);
					updateColumns(id);
					
				}
			}
			modifierChanged(saveModifier);
			break;
		}
	}

	
}
function chgModify(mObject={}){
	var idx = -1;
	var iidx = -1;
	var toEnd = true;
	for (var i in modifiers){
		var m = modifiers[i];
		if (m.enabled){
			idx++;
			if (idx != iidx){
				/*var qstring = 'a[name="'+idx+'"]';
				var el = document.getElementById('rawModified').querySelector(qstring);
				el.classList.remove('suggestedRaw');*/
			}
		}
		
		if (!document.getElementById('edit'+m.id)) {continue;}
		if (m.id == mObject.id){
			if (document.getElementById(m.id).style.borderColor != 'rgb(200, 200, 200)') {
				toEnd = false;
				document.getElementById('edit'+m.id).style.display = 'block';
				document.getElementById(m.id).style.borderColor = 'rgb(200, 200, 200)';
				var q = idx;
				iidx = idx;
				if (!m.enabled){q = idx+1; iidx = idx+1;}
				/*var qstring = 'a[name="'+q+'"]';
				var el = document.getElementById('rawModified').querySelector(qstring);
				el.classList.add('suggestedRaw');*/
				if (m.type == 'pivot'){
					updateNsteps(false,m.id,0);
				}
				else {
					updateNsteps(false,m.id,1);
				}
			}
			else {
				document.getElementById('edit'+m.id).style.display = 'none';
				document.getElementById(m.id).style.borderColor = 'white';
			}
			
			
		}
		else {
			document.getElementById('edit'+m.id).style.display = 'none';
			document.getElementById(m.id).style.borderColor = 'white';
		}
		
	}
	if (toEnd){
		updateNsteps(false,false);
	}
}
function clickModifier(evt){
	var id = '';
	if (evt.target){id = evt.target.id;}
	else {id = evt;}
	for (var i in modifiers){
		if (modifiers[i].id==id){
			chgModify(modifiers[i]);
			
			return;

		}
	}
}

function createPivot(obj) {
	
	
	var newEl = document.createElement('div');
	newEl.setAttribute('data-id',obj.type);
	newEl.textContent = obj.name;
	newEl.addEventListener('click',clickModifier);
	newEl.classList.add('hoverClick');
	if (!obj.enabled){newEl.style.textDecoration = 'line-through';}
	newEl.id = obj.id;
	document.getElementById('allModifiers').appendChild(newEl);
		
	let template = document.getElementById('pivot-template');
	let tc = template.content.cloneNode(true);
	let parentEl = document.getElementById('modifyDataBox');
	parentEl.appendChild(tc);
	var newM = parentEl.querySelector('#edit_id');
	newM.id = 'edit'+obj.id;
	
	var newI = newM.querySelector('#colcol_id');
	newI.id = 'colcol'+obj.id;
	newI = newM.querySelector('#pivotcol_id');
	newI.id = 'pivotcol'+obj.id;
	
	newM.querySelector('*[name=delete]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=disable]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=before]').addEventListener('click',updateNsteps);
	newM.querySelector('*[name=after]').addEventListener('click',updateNsteps);
	newM.querySelector('*[name=final]').addEventListener('click',updateNsteps);
	
	if (!obj.enabled){
		newM.querySelector('span[name=disable]').textContent = 'Enable';
		newM.querySelector('span[name=disable]').setAttribute('name','enable');
	}
	else {
		newM.querySelector('span[name=disable]').textContent = 'Disable';
	}
	
	newMM = newM.querySelector('select[name=pivot]');
	if (obj.options.column) {newMM.value = obj.options.pivot;}
	newMM.addEventListener('change',updateModifier);
	
	newM.querySelector('button[name=add]').addEventListener('click',updateModifier);
	
	var newD = newM.querySelector('div.pivotColumns');
	for (var i in obj.options.columns){
		var nDiv = document.createElement('div');
		nDiv.textContent = obj.options.columns[i].type + ' of ' + i;
		nDiv.addEventListener('click',updateModifier);
		nDiv.classList.add('hoverClick');
		nDiv.setAttribute('data-col',obj.options.columns[i].column);
		nDiv.setAttribute('data-type',obj.options.columns[i].type );
		nDiv.setAttribute('name','edit');
		newD.appendChild(nDiv);
	}
	var drakeP = dragula([newD], {
	  copy: function (el, source) {
		return false;
	  },
	  accepts: function (el, target, source) {
		return true;
	  },
	  removeOnSpill: function (el, source) {
		return true;
	  }
	});
	drakeP.on('drop', function (el, target, source, sibling) { 
		var modid = target.parentElement.parentElement.id.substring(4);
		var mymod = false;
		for (var ii in modifiers){
			if (modifiers[ii].id == modid){
				mymod = modifiers[ii];
				break;
			}
		}
		if (mymod){
			var els = target.querySelectorAll('div[data-col]');
			mymod.options.columns = [];
			for (var i=0;i<els.length;i++){
				var modcol = {'type':els[i].getAttribute('data-type'),'column':els[i].getAttribute('data-col')};
				mymod.options.columns.push(modcol);
			}
			modifierChanged(true);
		}
		else {
			console.log('should have found modifier');
		}
	});
	drakeP.on('remove', function (el, target, source, sibling) { 
		var modid = target.parentElement.parentElement.id.substring(4);
		var mymod = false;
		for (var ii in modifiers){
			if (modifiers[ii].id == modid){
				mymod = modifiers[ii];
				break;
			}
		}
		if (mymod){
			var els = target.querySelectorAll('div[data-col]');
			mymod.options.columns = [];
			for (var i=0;i<els.length;i++){
				var modcol = {'type':els[i].getAttribute('data-type'),'column':els[i].getAttribute('data-col')};
				mymod.options.columns.push(modcol);
			}
			modifierChanged(true);
		}
		else {
			console.log('should have found modifier');
		}
	});
	
}
/*
function copyReplace(evt) {
	var el = evt.target;
	var modid = evt.target.parentElement.parentElement.parentElement.parentElement.id.substring(4);
	var mymod = false;
	for (var ii in modifiers){
		if (modifiers[ii].id == modid){
			mymod = modifiers[ii];
			break;
		}
	}
	if (mymod){
		var idx = parseInt(el.parentElement.getAttribute('data-id'));
		var myoptions = mymod.options[idx];
		var newOptions = {};
		for (var k in myoptions){
			newOptions[k] = myoptions[k];
		}
		var ell = el.parentElement.parentElement.parentElement.querySelector('div[name=createReplace]');
		var nDivs = el.parentElement.parentElement.querySelectorAll('div[data-id]').length;
		ell.setAttribute('data-id',nDivs);
		ell.querySelector('input[name=find]').value = myoptions.find;
		ell.querySelector('input[name=replace]').value = myoptions.replace;
		ell.querySelector('input[name=numerical]').checked = myoptions.numerical;
		ell.querySelector('input[name=case]').checked = myoptions.case;
		ell.querySelector('input[name=full]').checked = myoptions.full;
		ell.querySelector('select[name=column]').value = myoptions.column;
		ell.querySelector('select[name=column] > option:checked').removeAttribute('selected');
		ell.querySelector('select[name=column] > option[value="'+myoptions.column+'"]').setAttribute('selected','selected');
		if (myoptions.row == -1){
			ell.querySelector('input[name=row]').value = '';
		}
		else {
			ell.querySelector('input[name=row]').value = myoptions.row;
		}
		
		mymod.options.push(newOptions);
		toReplaceElement(newOptions,'',el.parentElement.parentElement,false);
		el.parentElement.parentElement.querySelectorAll('div[data-id]')[nDivs].style.backgroundColor = 'rgb(200,200,200)';
	}
}
function editReplace(evt) {
	var el;
	if (!evt.target){
		el = evt;
	}
	else {
		el = evt.target.parentElement;
	}
	var otherEls = el.parentElement.querySelectorAll('div[data-id]');
	for (var i=0;i<otherEls.length;i++){
		otherEls[i].style.backgroundColor = '';
	}
	el.style.backgroundColor = 'rgb(200,200,200)';
	var modid = el.parentElement.parentElement.parentElement.id.substring(4);
	var mymod = false;
	for (var ii in modifiers){
		if (modifiers[ii].id == modid){
			mymod = modifiers[ii];
			break;
		}
	}
	if (mymod){
		var idx = parseInt(el.getAttribute('data-id'));
		var myoptions = mymod.options[idx];
		var ell = el.parentElement.parentElement.querySelector('div[name=createReplace]');
		ell.setAttribute('data-id',idx);
		ell.querySelector('input[name=find]').value = myoptions.find;
		ell.querySelector('input[name=replace]').value = myoptions.replace;
		ell.querySelector('input[name=numerical]').checked = myoptions.numerical;
		ell.querySelector('input[name=case]').checked = myoptions.case;
		ell.querySelector('input[name=full]').checked = myoptions.full;
		ell.querySelector('select[name=column]').value = myoptions.column;
		ell.querySelector('select[name=column] > option:checked').removeAttribute('selected');
		ell.querySelector('select[name=column] > option[value="'+myoptions.column+'"]').setAttribute('selected','selected');
		if (myoptions.row == -1){
			ell.querySelector('input[name=row]').value = '';
		}
		else {
			ell.querySelector('input[name=row]').value = myoptions.row;
		}
	}
}
function toReplaceElement(obj,idx,newMM,showText=true){
	var divs = newMM.querySelectorAll('div[data-id]');
	if (parseInt(idx)< divs.length){
		divs[parseInt(idx)].querySelector('span').textContent = ' Replace '+obj.find+' with '+obj.replace;
		return;
	}
	var newDiv = document.createElement('div');
	var newB = document.createElement('button');
	newB.textContent = 'Edit';
	newB.addEventListener('click',editReplace);
	newDiv.appendChild(newB);
	
	newB = document.createElement('button');
	newB.textContent = 'Copy';
	newB.addEventListener('click',copyReplace);
	newDiv.appendChild(newB);
	
	var newSpan = document.createElement('span');
	if (showText){
		newSpan.textContent = ' Replace '+obj.find+' with '+obj.replace;
	}
	newDiv.appendChild(newSpan);
	if (idx != ''){
		newDiv.setAttribute('data-id',idx);
	}
	else {
		var i = 0;
		for (i=0;i<divs.length;i++){
			divs[i].setAttribute('data-id',i);
			divs[i].style.backgroundColor = '';
		}
		newDiv.setAttribute('data-id',i);
	}
	newMM.appendChild(newDiv);
}
function createReplace(obj) {
	
	var newEl = document.createElement('div');
	newEl.setAttribute('data-id',obj.type);
	newEl.textContent = obj.name;
	newEl.addEventListener('click',clickModifier);
	newEl.classList.add('hoverClick');
	if (!obj.enabled){newEl.style.textDecoration = 'line-through';}
	newEl.id = obj.id;
	document.getElementById('allModifiers').appendChild(newEl);
		
	let template = document.getElementById('replace-template');
	let tc = template.content.cloneNode(true);
	let parentEl = document.getElementById('modifyDataBox');
	parentEl.appendChild(tc);
	var newM = parentEl.querySelector('#edit_id');
	newM.id = 'edit'+obj.id;
	
	var newI = newM.querySelector('#replaceCol_id');
	newI.id = 'replaceCol'+obj.id;
	
	newM.querySelector('*[name=delete]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=disable]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=before]').addEventListener('click',updateNsteps);
	newM.querySelector('*[name=after]').addEventListener('click',updateNsteps);
	newM.querySelector('*[name=final]').addEventListener('click',updateNsteps);
	
	if (!obj.enabled){
		newM.querySelector('span[name=disable]').textContent = 'Enable';
		newM.querySelector('span[name=disable]').setAttribute('name','enable');
	}
	else {
		newM.querySelector('span[name=disable]').textContent = 'Disable';
	}
	
	var newMM = newM.querySelector('div[name=allReplacements]');
	if (obj.options){
		for (var i=0;i<obj.options.length;i++){
			toReplaceElement(obj.options[i],i,newMM);
		}
	}
	
	var drakeP = dragula([newMM], {
	  copy: function (el, source) {
		return false;
	  },
	  accepts: function (el, target, source) {
		return true;
	  },
	  removeOnSpill: function (el, source) {
		return true;
	  }
	});
	drakeP.on('drag', function (el, target, source, sibling) { 
		editReplace(el);
	});
	drakeP.on('drop', function (el, target, source, sibling) { 
		var modid = target.parentElement.parentElement.id.substring(4);
		var mymod = false;
		for (var ii in modifiers){
			if (modifiers[ii].id == modid){
				mymod = modifiers[ii];
				break;
			}
		}
		if (mymod){
			var els = target.querySelectorAll('div[data-id]');
			var oldIndex = el.getAttribute('data-id');
			var newIndex;
			
			var oldReplace = mymod.options[oldIndex];
			Object.freeze(oldReplace);
			console.log(oldIndex);
			console.log(sibling);
			console.log(mymod.options);
			mymod.options.splice(oldIndex,1);
			if (sibling){
				newIndex = sibling.getAttribute('data-id');
				mymod.options.splice(newIndex,0,oldReplace);
			}
			else {
				mymod.options.push(oldReplace);
			}
			
			for (var i=0;i<els.length;i++){
				els[i].setAttribute('data-id',i);
			}
			console.log(mymod.options);
			modifierChanged(true);
		}
		else {
			console.log('should have found modifier');
		}
	});
	drakeP.on('remove', function (el, target, source, sibling) { 
		var modid = target.parentElement.parentElement.id.substring(4);
		var mymod = false;
		for (var ii in modifiers){
			if (modifiers[ii].id == modid){
				mymod = modifiers[ii];
				break;
			}
		}
		if (mymod){
			var els = target.querySelectorAll('div[data-id]');
			var oldIndex = el.getAttribute('data-id');
			
			var oldReplace = mymod.options[oldIndex];
			Object.freeze(oldReplace);
			mymod.options.splice(oldIndex,1);
			
			for (var i=0;i<els.length;i++){
				els[i].setAttribute('data-id',i);
			}
			console.log(mymod.options);
			modifierChanged(true);
		}
		else {
			console.log('should have found modifier');
		}
	});

	
	newMM = newM.querySelector('button[name=submit]');
	newMM.addEventListener('click',updateModifier);
	
	

}
*/
function createSort(obj) {
	var newEl = document.createElement('div');
	newEl.setAttribute('data-id',obj.type);
	newEl.textContent = obj.name;
	newEl.addEventListener('click',clickModifier);
	newEl.classList.add('hoverClick');
	if (!obj.enabled){newEl.style.textDecoration = 'line-through';}
	newEl.id = obj.id;
	document.getElementById('allModifiers').appendChild(newEl);
		
	let template = document.getElementById('sort-template');
	let tc = template.content.cloneNode(true);
	let parentEl = document.getElementById('modifyDataBox');
	parentEl.appendChild(tc);
	var newM = parentEl.querySelector('#edit_id');
	newM.id = 'edit'+obj.id;
	
	var newI = newM.querySelector('#sortcol1_id');
	newI.id = 'sortcol1_'+obj.id;
	newI.addEventListener('change',updateModifier);
	var newI = newM.querySelector('#sortcol2_id');
	newI.id = 'sortcol2_'+obj.id;
	newI.addEventListener('change',updateModifier);
	var newI = newM.querySelector('#sortcol3_id');
	newI.id = 'sortcol3_'+obj.id;
	newI.addEventListener('change',updateModifier);
	
	newI = newM.querySelector('input[name=descending1]');
	newI.addEventListener('change',updateModifier);
	if (!obj.options.ascending[0]){
		newI.setAttribute('checked','checked');
	}
	newI = newM.querySelector('input[name=descending2]');
	newI.addEventListener('change',updateModifier);
	if (!obj.options.ascending[1]){
		newI.setAttribute('checked','checked');
	}
	newI = newM.querySelector('input[name=descending3]');
	newI.addEventListener('change',updateModifier);
	if (!obj.options.ascending[2]){
		newI.setAttribute('checked','checked');
	}
	
	newM.querySelector('*[name=delete]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=disable]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=before]').addEventListener('click',updateNsteps);
	newM.querySelector('*[name=after]').addEventListener('click',updateNsteps);
	newM.querySelector('*[name=final]').addEventListener('click',updateNsteps);
	
	if (!obj.enabled){
		newM.querySelector('span[name=disable]').textContent = 'Enable';
		newM.querySelector('span[name=disable]').setAttribute('name','enable');
	}
	else {
		newM.querySelector('span[name=disable]').textContent = 'Disable';
	}

}

function toRowStr(objVar) {
	var rowStr = '';
	if (objVar.type == 'value' && objVar.row != '0'){
		if (objVar.row.indexOf('$') == 0){rowStr += ', Row '+objVar.row.substring(1);}
		else if (parseInt(objVar.row) < 0){rowStr += ', '+parseInt(objVar.row)*-1 + ' Row Before';}
		else {rowStr += ', '+parseInt(objVar.row)+' Row After';}
	}
	if (objVar.type != 'value' && objVar.row != '0,-1'){
		var rows = objVar.row.split(',');
		if (rows[0].indexOf('$') == 0){rowStr += ', Row '+rows[0].substring(1);}
		else if (parseInt(rows[0]) < 0){rowStr += ', '+parseInt(rows[0])*-1 + ' Row Before';}
		else if (parseInt(rows[0]) == 0){rowStr += ', Current Row';}
		else {rowStr += ', '+parseInt(rows[0])+' Row After';}
		
		if (rows[1].indexOf('$') == 0){rowStr += ' to Row '+rows[1].substring(1);}
		else if (parseInt(rows[1]) < 0){rowStr += ' to '+parseInt(rows[1])*-1 + ' Row Before';}
		else if (parseInt(rows[1]) == 0){rowStr += ' to Current Row';}
		else {rowStr += ' to '+parseInt(rows[1])+' Row After';}
	}
	return rowStr;
}

function fillNew(obj) {
	var selectorEl = document.getElementById(obj.id);
	var el = document.getElementById('edit'+obj.id);
	selectorEl.textContent = obj.name;
	if (!obj.enabled){
		selectorEl.style.textDecoration = 'line-through';
		el.querySelector('span[name=disable]').textContent = 'Enable';
		el.querySelector('span[name=disable]').setAttribute('name','enable');
	}
	else {
		selectorEl.style.textDecoration = 'none';
		el.querySelector('span[name=disable]').textContent = 'Disable';
	}
	
	
	el.querySelector('input[name=name]').value = obj.name;
	
	//formula
	el.querySelector('textarea[name=formula]').value = obj.options.formula;
	katex.render(toKatex(obj.options.formula), el.querySelector('div[name=katex]'), {
		throwOnError: false
	});
	
	//Place blank allVariables
	var allV = el.querySelector('#allVariables');
	if (allV.children.length == 0){
		for (var i in obj.options.variables){
			var objVar = obj.options.variables[i];
			var newEl = document.createElement('div');
			newEl.setAttribute('name',i);
			newEl.setAttribute('data-type','showVar');
			newEl.addEventListener('click',updateModifier);
			newEl.classList.add('hoverClick');
			allV.appendChild(newEl);
		}
	}
	
}
function createNew(obj) {
	var newEl = document.createElement('div');
	newEl.setAttribute('data-id',obj.type);
	newEl.addEventListener('click',clickModifier);
	newEl.classList.add('hoverClick');
	newEl.id = obj.id;
	document.getElementById('allModifiers').appendChild(newEl);
		
	let template = document.getElementById('newColumn-template');
	let tc = template.content.cloneNode(true);
	let parentEl = document.getElementById('modifyDataBox');
	parentEl.appendChild(tc);
	var newM = parentEl.querySelector('#edit_id');
	newM.id = 'edit'+obj.id;
	if (obj.type == 'filter'){
		newM.querySelector('span[name=description]').textContent = 'Filter: ';
	}
	
	
	//Update Names
	var names = ['row','rowstart','rowend'];
	var ids = ['newcolVar','value','group'];
	var idfors = ['currentRow','previousRow','nextRow','equalRow'];
	for (var i=0;i<names.length;i++){
		var els = newM.querySelectorAll('input[name='+names[i]+'_id]');
		for (var ii=0;ii<els.length;ii++){
			els[ii].setAttribute('name',names[i]+obj.id);
		}
		
	}
	for (var i=0;i<ids.length;i++){
		newM.querySelector('#'+ids[i]+'_id').id=ids[i]+obj.id;
	}
	for (var i=0;i<idfors.length;i++){
		newM.querySelector('#'+idfors[i]+'_id').id=idfors[i]+obj.id;
		newM.querySelector('label[for='+idfors[i]+'_id]').setAttribute('for',idfors[i]+obj.id);
		if (idfors[i] != 'currentRow'){
			newM.querySelector('#'+idfors[i]+'start_id').id=idfors[i]+'start'+obj.id;
			newM.querySelector('label[for='+idfors[i]+'start_id]').setAttribute('for',idfors[i]+'start'+obj.id);
			newM.querySelector('#'+idfors[i]+'end_id').id=idfors[i]+'end'+obj.id;
			newM.querySelector('label[for='+idfors[i]+'end_id]').setAttribute('for',idfors[i]+'end'+obj.id);
		}
	}
	//Add EventListeners
	names = ['name','formula','type'];
	newM.querySelector('input[name=name]').addEventListener('change',updateModifier);
	newM.querySelector('textarea[name=formula]').addEventListener('change',updateModifier);
	newM.querySelector('select[name=type]').addEventListener('change',updateModifier);
	
	newM.querySelector('button[name=add]').addEventListener('click',updateModifier);
	newM.querySelector('button[name=clear]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=delete]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=disable]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=before]').addEventListener('click',updateNsteps);
	newM.querySelector('*[name=after]').addEventListener('click',updateNsteps);
	newM.querySelector('*[name=final]').addEventListener('click',updateNsteps);
	//newM.querySelector('*[name=save]').addEventListener('click',updateModifier);

	//createNewColumnBox(obj.id);
	fillNew(obj);
}
function createFilter(obj) {
	createNew(obj);
	var el = document.getElementById('edit'+obj.id);
	var ie = el.querySelector('#includeExclude');
	ie.style.display = 'block';
	if (obj.options.exclude){
		ie.querySelector('input[value=exclude]').checked = true;
	}
	ie.querySelector('input[value=exclude]').addEventListener('change',updateModifier);
	ie.querySelector('input[value=include]').addEventListener('change',updateModifier);
}

function createNewModifier(show=false) {
	var el = document.getElementById('createModifyMenu');
	var ell = el.querySelector('option:checked');
	if (show){
		el.style.display = 'inline-block';
		el.value = '';
		return;
	}
	var mType = '';
	if (ell && ell.value != ''){
		mType = ell.value;
		var id = Math.random().toString(36).substr(2, 8);
		var oldObject = {'id':id,'name':mType,'type':mType,'options':{},'enabled':true};
		if (mType == 'new'){
			oldObject.options = {'formula':'','variables':{}};
			createNew(oldObject);
		}
		else if (mType == 'sort'){
			oldObject.options = {'column':[0,false,false],'ascending':[true,true,true]};
			createSort(oldObject);
		}
		else if (mType == 'replace'){
			//{'column':-1,'row':-1,'regex':false,'full':false,'case':false,'numerical':false}
			oldObject.options = [];
			createReplace(oldObject);
		}
		else if (mType == 'filter'){
			oldObject.options = {'formula':'','variables':{},'exclude':false};
			createFilter(oldObject);
		}
		else if (mType == 'pivot'){
			oldObject.options = {'pivot':0,'columns':[]};
			createPivot(oldObject);
		}
		el.style.display = 'none';
		el.value = '';
		modifiers.push(oldObject);
		console.log(modifiers);
		modifierChanged();
		chgModify(oldObject);
		updateColumns();
	}
	
	
}
var drakeF = dragula([document.getElementById('allModifiers')], {
  copy: function (el, source) {
    return false;
  },
  accepts: function (el, target, source) {
  	if (target === document.getElementById('allModifiers')) {return true;}
  	else {return false;}
    
  },
  revertOnSpill: function (el, source) {
    return true;
  }
});

drakeF.on('drop', function (el, target, source, sibling) { 
	//Need to reorder if not the end
	if (target.id == 'allModifiers') {
		var reorder = false;
		var oldObject = {};
		for (var i in modifiers){
			if (modifiers[i].id==el.id){
				oldObject = modifiers[i];
				modifiers.splice(i,1);
				reorder = true;
				break;
			}
		}
		
		if (!reorder){
			console.log("shouldn't be here")
			
		}


		if (sibling){
			for (var i in modifiers){
				if (modifiers[i].id==sibling.id){
					modifiers.splice(i,0,oldObject);
					break;
				}
			}
		}
		else {
			modifiers.push(oldObject);
		}

		modifierChanged();
	}
});
drakeF.on('drag', function (el, target, source, sibling) { 
	if (target.id == 'allModifiers') {
		for (var i in modifiers){
			if (modifiers[i].id==el.id){
				chgModify(modifiers[i]);
				break;
			}
		}
		
	}
});


// Minimize and Maximize elements
function minimizeBox(boxid,full=false){
	if (boxid == 'dataSource' && minimizedBoxes[boxid] == 'large'){
		var el = document.getElementById('dataSourceBox');
		el.style.display = 'none';
		var otherEl = document.getElementById('dataTableHolder');
		otherEl.classList.add('pure-u-lg-1-1');
		otherEl.classList.remove('pure-u-lg-3-4');
		otherEl.classList.add('pure-u-md-1-1');
		otherEl.classList.remove('pure-u-md-2-3');
		minimizedBoxes[boxid] = 'small';
		if (document.getElementById('editSource')){
			document.getElementById('editSource').style.display = 'inline';
		}
		redrawTable();
		
	}
	else if (boxid == 'dataSource' && minimizedBoxes[boxid]== 'small'){
		var el = document.getElementById('dataSourceBox');
		el.style.display = 'block';
		var otherEl = document.getElementById('dataTableHolder');
		otherEl.classList.remove('pure-u-lg-1-1');
		otherEl.classList.add('pure-u-lg-3-4');
		otherEl.classList.remove('pure-u-md-1-1');
		otherEl.classList.add('pure-u-md-2-3');
		minimizedBoxes[boxid] = 'large';
		if (document.getElementById('editSource')){
			document.getElementById('editSource').style.display = 'none';
		}
		redrawTable();
	}
	else if (boxid == 'dataTable' || boxid == 'modifyData' || boxid == 'createChart'){
		if (minimizedBoxes[boxid] == 'large'){
			var el = document.getElementById(boxid+'Box');
			el.style.display = 'none';
			minimizedBoxes[boxid] = 'small';
			var elp = el.parentElement;
			elp.classList.add('l-box-thin');
			elp.classList.remove('l-box-half');
			var ell = elp.querySelector('.box-header i.fa-compress-alt');
			ell.classList.remove('fa-compress-alt');
			ell.classList.add('fa-expand-alt');
			
		}
		else {
			var el = document.getElementById(boxid+'Box');
			el.style.display = 'flex';
			minimizedBoxes[boxid] = 'large';
			var elp = el.parentElement;
			elp.classList.add('l-box-half');
			elp.classList.remove('l-box-thin');
			var ell = elp.querySelector('.box-header i.fa-expand-alt');
			ell.classList.add('fa-compress-alt');
			ell.classList.remove('fa-expand-alt');
		}
		if (boxid == 'dataTable'){
			redrawTable();
		}
	}
	else if (boxid == 'chartjs' || boxid == 'plotly' || boxid == 'xkcd' || boxid == 'google'){
		if (full){
			var el = document.getElementById(boxid+'Box');
			el.classList.add('pure-u-lg-1-1');
			el.classList.remove('pure-u-lg-1-2');
			el.style.display = 'block';
			minimizedBoxes[boxid] = 'full';
			var myStyle = el.querySelector('chartdn-chart').getAttribute('data-style');
			var jsonmessage = {'operation':'view','id':chartid,'loc':0,'style':myStyle};
			ws.send(JSON.stringify(jsonmessage));
			var el2 = document.getElementById(boxid+'None');
			el2.style.display = 'none';
		}
		else if (minimizedBoxes[boxid] == 'full') {
			var el = document.getElementById(boxid+'Box');
			el.classList.add('pure-u-lg-1-2');
			el.classList.remove('pure-u-lg-1-1');
			el.style.display = 'block';
			var myStyle = el.querySelector('chartdn-chart').getAttribute('data-style');
			var jsonmessage = {'operation':'view','id':chartid,'loc':0,'style':myStyle}
			ws.send(JSON.stringify(jsonmessage));
			minimizedBoxes[boxid] = 'half';
		}
		else if (minimizedBoxes[boxid] == 'half') {
			var el = document.getElementById(boxid+'Box');
			el.style.display = 'none';
			var el2 = document.getElementById(boxid+'None');
			el2.style.display = 'block';
			minimizedBoxes[boxid] = 'none';
		}
		else if (minimizedBoxes[boxid] == 'none') {
			var el = document.getElementById(boxid+'Box');
			el.classList.add('pure-u-lg-1-2');
			el.classList.remove('pure-u-lg-1-1');
			el.style.display = 'block';
			var myStyle = el.querySelector('chartdn-chart').getAttribute('data-style');
			var jsonmessage = {'operation':'view','id':chartid,'loc':0,'style':myStyle}
			ws.send(JSON.stringify(jsonmessage));
			minimizedBoxes[boxid] = 'half';
			var el2 = document.getElementById(boxid+'None');
			el2.style.display = 'none';
		}
	}
	else if (boxid == 'yAxis' || boxid == 'yAxisData' || boxid == 'yAxisFormat'){
		if (minimizedBoxes[boxid] == 'large'){
			var el = document.getElementById(boxid+'Box');
			el.style.display = 'none';
			minimizedBoxes[boxid] = 'small';
			if (boxid == 'yAxisData'){
				var el2 = document.getElementById(boxid+'Box2');
				el2.style.display = 'none';
			}
			var ell = document.getElementById(boxid+'BoxH').querySelector('i.fa-compress-alt');
			ell.classList.remove('fa-compress-alt');
			ell.classList.add('fa-expand-alt');
			
		}
		else {
			var el = document.getElementById(boxid+'Box');
			el.style.display = 'block';
			minimizedBoxes[boxid] = 'large';
			if (boxid == 'yAxisData'){
				var el2 = document.getElementById(boxid+'Box2');
				el2.style.display = 'block';
			}
			var ell = document.getElementById(boxid+'BoxH').querySelector('i.fa-compress-alt');
			ell.classList.add('fa-compress-alt');
			ell.classList.remove('fa-expand-alt');
		}
	}
}


function showMoreOptions(collapse=false) {
	var el = document.getElementById('showMoreOptions');
	if (collapse){
		el.style.display = 'none';
		el.parentElement.querySelector('button[name=showMore]').textContent = 'Show More Options';
		el.parentElement.querySelector('button[name=showMore]').setAttribute('onclick','showMoreOptions(false)');
	}
	else {
		el.style.display = 'block';
		el.parentElement.querySelector('button[name=showMore]').textContent = 'Hide Options';
		el.parentElement.querySelector('button[name=showMore]').setAttribute('onclick','showMoreOptions(true)');
	}
}




