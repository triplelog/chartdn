
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
	//var d = new Date(); var n = d.getTime(); console.log('time6: ', n);
	var dm = JSON.parse(evt.data);
	if (dm.operation == 'downloaded'){
		document.getElementById('dataCopy').value = dm.message;
		dataChanged(true);
	}
	else if (dm.operation == 'id'){
		chartid = dm.message;
	}
	else if (dm.operation == 'chart'){
		//var d = new Date(); var n = d.getTime(); console.log('time7: ', n);
		var chartJSON = dm.message;
		var allCharts = document.querySelectorAll('chartdn-chart');
		for (var i=0;i< allCharts.length;i++){
			if (allCharts[i].getAttribute('data-style')==dm.style){
				allCharts[i].makeChart(chartJSON);
			}
		}
		if (dm.mdata){
			updateTable(dm.mdata);
			allHeaders = dm.allHeaders;
			updateColumns();
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
}



function getOrdinal(n) {
   var s=["th","st","nd","rd"],
       v=n%100;
   return n+(s[(v-20)%10]||s[v]||s[0]);
}
// Set options like number of Header Rows
var nHeaders = 1;
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
var nsteps;
var useDataChanges = [];
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
	console.log('Headers Changed',headers);
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
		if (initialData && document.getElementById('xColVal').value != ''){
			var xcv = parseInt(document.getElementById('xColVal').value);
			document.getElementById('xColumnSelect').value =  xcv;
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
			}
			chgLineTab();
			chgModify();
			document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
		
		}
	}
	else {
		var colChg = false;
		if (document.getElementById('xColVal').value != ''){
			var xcv = parseInt(document.getElementById('xColVal').value);
			document.getElementById('xColumnSelect').value =  xcv;
			if (xcv < headers.length){
			}
			else {
				document.getElementById('xColVal').value = '';
				colChg = true;
			}
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
				}
				else {
					colChg = true;
					skipRows.push(yColsVals[yid]);
				}
			}
			chgLineTab();
			document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
			
		
		}
		if (colChg){
			columnsChg();
			for (var i in skipRows){
				var qstring = 'option[value="'+i+'"]';
				console.log(qstring);
				var ell = document.getElementById('lineStyleMenu').querySelector(qstring);
				ell.parentElement.removeChild(ell);
		
				qstring = '#lineStyleDiv'+i;
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
	console.log(colid);
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
	var delimiter = document.getElementById('delimiter').value;
	if (delimiter.toLowerCase() == 'auto'){delimiter = '';}
	
	var jsonmessage = {'operation':'download','message':url,'delimiter':delimiter};
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

// Set table if already have data
var oldData = document.getElementById('dataCopy').value;
if (oldData.length > 0){
	dataChanged(true);
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
		el.querySelector(qstring).textContent = headers[id];
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
	else {
		var newoption = document.querySelector('input[name='+optionname+']').value;
		var jsonmessage = {'operation':'options'};
		jsonmessage[optionname]=newoption;
		ws.send(JSON.stringify(jsonmessage));
	}
}
function chgStep(evt) {
	var el = evt.target;
	nsteps = parseInt(el.getAttribute('name'));
	var ell = document.getElementById('rawModified');
	var qel = ell.querySelectorAll('a[name]');
	for (var i=0;i<qel.length;i++){
		if (i != nsteps){qel[i].classList.remove('selectedRaw');}
		else {qel[i].classList.add('selectedRaw');}
	}
	var jsonmessage = {'operation':'options','nsteps':nsteps};
	ws.send(JSON.stringify(jsonmessage));
}
function modifierChanged(initial=false) {
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
	if (!initial){
		var jsonmessage = {'operation':'options','modifiers':modifiers};
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
			newObject.options.column = parseInt(col);
			if (evt.target.getAttribute('name')=='ascButton') {
				newObject.options.ascending = true;
			}
			else {
				newObject.options.ascending = false;
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
					modifierChanged();
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
		if(tippys[col]){
			tippys[col].destroy();
			delete tippys[col];
		}
	}
	else {
		var row = evt.target.parentElement.parentElement.getAttribute('data-row');
		if(tippysR[row]){
			tippysR[row].destroy();
			delete tippysR[row];
		}
	}
	
}

function updateTable(data) {
	
	headers = [];
	var tableData = [];
	var tableColumns = [];
	
	var includeHeaders = false;
	for (var i=0;i<data.length;i++){
		var newDataRow = {id:i};
		if (i < nHeaders){
			var thisColumn = {};
			thisColumn.title = 'Row';
			thisColumn.field = 'colRow';
			thisColumn.cellClick = function(e, cell){
				var row = cell.getRow()['_row'].data.colRow;
				if (!tippysR[row]){
					let templateR = document.getElementById('clickRow-template');
					let tcr = templateR.content.cloneNode(true).firstElementChild;
					tcr.setAttribute('data-row',row);
					tcr.querySelector('button[name=ignoreButton]').addEventListener('click',clickTippy);
					tcr.querySelector('button[name=matchButton]').addEventListener('click',clickTippy);
						
					let mytippy = tippy(e.target, {
					  content: tcr,
					  appendTo: document.querySelector('.header'),
					  trigger: 'manual',
					  interactive: true,
					  placement: 'left',
					});
					tippysR[row] = mytippy;
					mytippy.show();
				}
				else {
					tippysR[row].show();
				}
			}
			tableColumns[0] = thisColumn;
		}
		else {
			newDataRow.colRow = i - nHeaders;
		}
		
		for (var ii=0;ii<data[i].length;ii++){
			
			if (i==0){
				if (nHeaders > 0) {
					headers.push(data[i][ii]);
				}
				else {
					headers.push(getOrdinal(ii+1));
				}
				var thisColumn = {};
				thisColumn.title = headers[headers.length-1];
				thisColumn.field = 'col'+ii;
				thisColumn.headerClick = function(e, column){
					var col = column['_column'].field.substring(3);
					//if (!tippys[col]){
						let template = document.getElementById('clickColumn-template');
						let tc = template.content.cloneNode(true).firstElementChild;
						tc.setAttribute('data-col',col);
						tc.setAttribute('data-name',headers[parseInt(col)]);
						tc.querySelector('button[name=xButton]').addEventListener('click',clickTippy);
						tc.querySelector('button[name=yButton]').addEventListener('click',clickTippy);
						tc.querySelector('button[name=pivotButton]').addEventListener('click',clickTippy);
						tc.querySelector('button[name=ascButton]').addEventListener('click',clickTippy);
						tc.querySelector('button[name=descButton]').addEventListener('click',clickTippy);
						
						let mytippy = tippy(e.target, {
						  content: tc,
						  appendTo: document.querySelector('.header'),
						  trigger: 'manual',
						  interactive: true,
						  placement: 'bottom',
						});
						tippys[col] = mytippy;
						mytippy.show();
					//}
					//else {
					//	tippys[col].show();
					//}
				}
				if (!modifiers || modifiers.length == 0 || nsteps == 0){
					thisColumn.editor = 'input';
				}
				tableColumns.push(thisColumn);
				
				
			}
			else {
				newDataRow['col'+ii]=data[i][ii];
			}
		}
		if (newDataRow['col0']){
			tableData.push(newDataRow);
		}
		
		
	}
	var dataTable = document.getElementById("dataTableModified");
	dataTable.innerHTML = '';
	table = new Tabulator("#dataTableModified", {
		columns: tableColumns,
		autoResize:true,
		height:"100%",
		headerSort: false,
		layout:"fitData",
		layoutColumnsOnNewData:true,
		cellEdited:function(cell){
			var row = cell['_cell'].row.data.colRow;
			var col = cell['_cell'].column.field;
			var value = cell['_cell'].value;
			userDataChanges.push({'row':row,'col':col,'value':value});
		},
	});
	table.addData(tableData.slice(0,1000), false);
	table.redraw(true);
	headersChanged(false,true);
}
var syncWorker2 = new Worker('../wasm/datatypeworker.js');
function dataChanged(initialData=false,dataType='csv') {
	
	var csv = dataCopy.value;
	syncWorker2.postMessage(csv);
	syncWorker2.onmessage = function(e) {
		console.log(e);
	};
	if (!initialData){
		var delimiter = document.getElementById('delimiter').value;
		if (delimiter.toLowerCase() == 'auto'){delimiter = '';}
		var d = new Date(); var n = d.getTime(); console.log('time: ', n);
		var jsonmessage = {'operation':'upload','message':csv,'delimiter':delimiter};
		if (dataType != 'csv'){
			jsonmessage.type = dataType;
		}
		ws.send(JSON.stringify(jsonmessage));
	}
	else {
		if (csv.length > 0){minimizeBox('dataSource');}
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
			else if (modifiers[i].type == 'ignore'){
				createIgnore(modifiers[i]);
			}
		}
	}
	var data = Papa.parse(csv).data;
	headers = [];
	var includeHeaders = false;
	for (var i=0;i<data.length;i++){
		for (var ii=0;ii<data[i].length;ii++){
			if (i==0){
				if (nHeaders > 0) {
					headers.push(data[i][ii]);
				}
				else {
					headers.push(getOrdinal(ii+1));
				}
			}
		}
		
	}
	modifierChanged(initialData);
	headersChanged(initialData);

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
});
drake.on('remove', function (el, target, source) { 
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
});
drake.on('drag', function (el, target, source) { 
	var elval = el.id.substring(5);
	document.getElementById('lineStyleMenu').value = elval;
	chgLineTab();
});
function clickLineData(evt) {
	var elval = evt.target.id.substring(5);
	console.log(elval);
	document.getElementById('lineStyleMenu').value = elval;
	chgLineTab();
}




//Dragula with column choices
function updateColumns(id='all') {
	for (var i in modifiers){
		if (id=='all' || modifiers[i].id == id){
			if (modifiers[i].type == 'new' || modifiers[i].type == 'ignore'){
				var el = document.getElementById('newcolVar'+modifiers[i].id);
				var elval = el.value;
				el.innerHTML = '';
				var cols = allHeaders[modifiers[i].id];
				console.log(cols);
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
						newEl.textContent = ii + ' := ' + objVar.type + ' of ' + cols[objVar.column];
					}
					var rowStr = toRowStr(objVar);
					newEl.textContent += rowStr;
				}
				
			
			}
			else if (modifiers[i].type == 'replace'){
				var el = document.getElementById('replaceCol'+modifiers[i].id);
				var elval = el.value;
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
				var el = document.getElementById('sortcol'+modifiers[i].id);
				var elval = modifiers[i].options.column;
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
				if (el.getAttribute('name')=='column'){
					//modifiers[i].options.type = evt.target.querySelector('option:checked').value;
					modifiers[i].options.column = parseInt(el.value);
					modifiers[i].name = 'Sort by ' + el.querySelector('option:checked').textContent;
					document.getElementById(modifiers[i].id).textContent = 'Sort by ' + el.querySelector('option:checked').textContent;
				}
				else if (el.getAttribute('name')=='descending'){
					modifiers[i].options.ascending = !el.checked;
				}
			}
			else if (mType == 'replace'){
				if (el.getAttribute('name')=='find'){
					modifiers[i].options.find = el.value;
				}
				else if (el.getAttribute('name')=='replace'){
					modifiers[i].options.replace = el.value;
				}
				else if (el.getAttribute('name')=='column'){
					modifiers[i].options.column = parseInt(el.value);
				}
				else if (el.getAttribute('name')=='case'){
					modifiers[i].options.case = el.checked;
				}
				else if (el.getAttribute('name')=='numerical'){
					modifiers[i].options.numerical = el.checked;
				}
				else if (el.getAttribute('name')=='full'){
					modifiers[i].options.full = el.checked;
				}
			}
			else if (mType == 'new' || mType == 'ignore'){
				console.log('hello');
				if (el.getAttribute('name')=='formula'){
					modifiers[i].options.formula = el.value;
					var ell = el.parentElement.querySelector('div[name=katex]');
					katex.render(modifiers[i].options.formula, ell, {
						throwOnError: false
					});
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
				}
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
					
				}
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
			break;
		}
	}

	modifierChanged();
}
function chgModify(mObject={}){
	var idx = -1;
	var iidx = -1;
	for (var i in modifiers){
		var m = modifiers[i];
		if (m.enabled){
			idx++;
			if (idx != iidx){
				var qstring = 'a[name="'+idx+'"]';
				var el = document.getElementById('rawModified').querySelector(qstring);
				el.classList.remove('suggestedRaw');
			}
		}
		
		if (!document.getElementById('edit'+m.id)) {continue;}
		if (m.id == mObject.id){
			if (document.getElementById(m.id).style.borderColor != 'rgb(200, 200, 200)') {
				document.getElementById('edit'+m.id).style.display = 'block';
				document.getElementById(m.id).style.borderColor = 'rgb(200, 200, 200)';
				var q = idx;
				iidx = idx;
				if (!m.enabled){q = idx+1; iidx = idx+1;}
				var qstring = 'a[name="'+q+'"]';
				var el = document.getElementById('rawModified').querySelector(qstring);
				el.classList.add('suggestedRaw');
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
		var type = el.getAttribute('data-type');
		var col = el.getAttribute('data-col');
	});
	drakeP.on('remove', function (el, target, source, sibling) { 
		var type = el.getAttribute('data-type');
		var col = el.getAttribute('data-col');
	});
	
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
	
	if (!obj.enabled){
		newM.querySelector('span[name=disable]').textContent = 'Enable';
		newM.querySelector('span[name=disable]').setAttribute('name','enable');
	}
	else {
		newM.querySelector('span[name=disable]').textContent = 'Disable';
	}
	
	var newMM = newM.querySelector('input[name=find]');
	if (obj.options.find) {newMM.value = obj.options.find;}
	newMM.addEventListener('change',updateModifier);
	
	newMM = newM.querySelector('input[name=replace]');
	if (obj.options.replace) {newMM.value = obj.options.replace;}
	newMM.addEventListener('change',updateModifier);
	
	newMM = newM.querySelector('input[name=case]');
	if (obj.options.case) {newMM.checked = true;}
	newMM.addEventListener('change',updateModifier);
	
	newMM = newM.querySelector('input[name=numerical]');
	if (obj.options.numerical) {newMM.checked = true;}
	newMM.addEventListener('change',updateModifier);
	
	newMM = newM.querySelector('input[name=full]');
	if (obj.options.full) {newMM.checked = true;}
	newMM.addEventListener('change',updateModifier);
	
	newMM = newM.querySelector('select[name=column]');
	if (obj.options.column) {newMM.value = obj.options.column;}
	newMM.addEventListener('change',updateModifier);
	
	

}

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
	
	var newI = newM.querySelector('#sortcol_id');
	newI.id = 'sortcol'+obj.id;
	newI.addEventListener('change',updateModifier);
	
	newI = newM.querySelector('input[name=descending]');
	newI.addEventListener('change',updateModifier);
	if (!obj.options.ascending){
		newI.setAttribute('checked','checked');
	}
	
	newM.querySelector('*[name=delete]').addEventListener('click',updateModifier);
	newM.querySelector('*[name=disable]').addEventListener('click',updateModifier);
	
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
	
	
	el.querySelector('span[name=title]').textContent = obj.name;
	el.querySelector('input[name=name]').value = obj.name;
	
	//formula
	el.querySelector('textarea[name=formula]').value = obj.options.formula;
	katex.render(obj.options.formula, el.querySelector('div[name=katex]'), {
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
	if (obj.type == 'ignore'){
		newM.querySelector('span[name=description]').textContent = 'Ignore Row if: ';
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
	//Prefill variables, etc.
	//Add event listener to header buttons
	
	
	//createNewColumnBox(obj.id);
	fillNew(obj);
}
function createIgnore(obj) {
	createNew(obj);
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
			oldObject.options = {'column':0,'ascending':true};
			createSort(oldObject);
		}
		else if (mType == 'replace'){
			oldObject.options = {'column':-1,'regex':false,'full':false,'case':false,'numerical':false};
			createReplace(oldObject);
		}
		else if (mType == 'ignore'){
			oldObject.options = {'formula':'','variables':{}};
			createIgnore(oldObject);
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
		otherEl.classList.add('pure-u-1-1');
		otherEl.classList.remove('pure-u-3-4');
		minimizedBoxes[boxid] = 'small';
		document.getElementById('editSource').style.display = 'inline';
		if (table){table.redraw(true);}
	}
	else if (boxid == 'dataSource' && minimizedBoxes[boxid]== 'small'){
		var el = document.getElementById('dataSourceBox');
		el.style.display = 'block';
		var otherEl = document.getElementById('dataTableHolder');
		otherEl.classList.remove('pure-u-1-1');
		otherEl.classList.add('pure-u-3-4');
		minimizedBoxes[boxid] = 'large';
		document.getElementById('editSource').style.display = 'none';
		if (table){table.redraw(true);}
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
			table.redraw(true);
		}
	}
	else if (boxid == 'chartjs' || boxid == 'plotly' || boxid == 'xkcd' || boxid == 'google'){
		if (full){
			var el = document.getElementById(boxid+'Box');
			el.classList.add('pure-u-1-1');
			el.classList.remove('pure-u-1-2');
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
			el.classList.add('pure-u-1-2');
			el.classList.remove('pure-u-1-1');
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
			el.classList.add('pure-u-1-2');
			el.classList.remove('pure-u-1-1');
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
minimizeBox('modifyData');
minimizeBox('yAxis');
var chartType = document.getElementById('chartTypeMenu').querySelector('option:checked').value;
if (chartType == 'line'){
	showLineChartOptions();
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




