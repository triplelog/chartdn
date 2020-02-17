
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
	var d = new Date(); var n = d.getTime(); console.log('time6: ', n);
	var dm = JSON.parse(evt.data);
	if (dm.operation == 'downloaded'){
		document.getElementById('dataCopy').value = dm.message;
		dataChg(true);
	}
	else if (dm.operation == 'id'){
		chartid = dm.message;
	}
	else if (dm.operation == 'chart'){
		var d = new Date(); var n = d.getTime(); console.log('time7: ', n);
		var chartJSON = dm.message;
		var allCharts = document.querySelectorAll('chartdn-chart');
		for (var i=0;i< allCharts.length;i++){
			if (allCharts[i].getAttribute('data-style')==dm.style){
				allCharts[i].makeChart(chartJSON);
			}
		}
		var d = new Date(); var n = d.getTime(); console.log('time8: ', n);
		updateModifiedTable(dm.mdata);
		var d = new Date(); var n = d.getTime(); console.log('time9: ', n);
		allHeaders = dm.allHeaders;
		updateColumns();
	}
	else if (dm.operation == 'headers'){
		var oldHeaders = [];
		for (var i in headers){
			oldHeaders.push(headers[i]);
		}
		headers = dm.message;
		updateHeaders(true,oldHeaders);
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
var headers = [];
var allHeaders = {};
var colid = -1;
var minimizedBoxes = {};
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

//Update Headers
function updateHeaders(initialData,chg=false) {
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
				ell.parentNode.removeChild(ell);
		
				qstring = '#lineStyleDiv'+i;
				ell = document.getElementById("yAxisFormatBox").querySelector(qstring);
				ell.parentNode.removeChild(ell);
			}
		}
	}
}

// Change Tab of which line to style
function chgLineTab(){
	
	colid = document.getElementById('lineStyleMenu').querySelector('*:checked').value;

	
	var lineDivs = document.getElementById('yAxisFormatBox').children;
	for (var i=0;i<lineDivs.length;i++){
		if (lineDivs[i].id != 'lineStyleDiv'+colid) {
			lineDivs[i].style.display = 'none';
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
	if (url.indexOf('.csv') == url.length-4){
	
	}
	else {
		jsonmessage.type = 'xls';
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
	var radioChecked = document.querySelector("input[name=dataSourceType]:checked").value;
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
	dataChg(true);
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
	var el = document.createElement('div');
	el.id = "lineStyleDiv"+id;
	el.innerHTML = `
		<div>
			<label>Name</label>
			<input type="text" name="lineName" onchange="optionsChg('lineName')" placeholder="default"/>
		</div>
		<div>
			<label>Line Color</label>
			<input type="text" name="lineColor" onchange="optionsChg('lineColor')" placeholder="default"/>
		</div>
		<div>
			<label>Dot Color</label>
			<input type="text" name="dotColor" placeholder="default"/>
		</div>
		<div>
			<label>Line Shape</label>
			<input type="radio" name="shape`+id+`" onchange="optionsChg('shape')" value="linear" checked>Linear</input>
			<input type="radio" name="shape`+id+`" onchange="optionsChg('shape')" value="spline">Smooth</input>
		</div>
		<div>
			<label>Line Type</label>
			<select name="dash`+id+`" onchange="optionsChg('dash')">
				<option value="solid" checked>Solid</option>
				<option value="dash">Dash</option>
				<option value="dot">Dot</option>
				<option value="dashdot">DashDot</option>
			</select>
		</div>`;
	document.getElementById("yAxisFormatBox").appendChild(el);
	
	var newEl = document.createElement('option');
	newEl.value = id;
	newEl.textContent = headers[id];
	document.getElementById('lineStyleMenu').appendChild(newEl);
	
	if (document.getElementById("yAxisFormatBox").children.length == 2){
		document.getElementById('lineStyleMenu').value = id;
	}
	
	
	chgLineTab();
}
function columnsChg() {
	var yColsStr = document.getElementById('yColsVal').value;
	var xColStr = document.getElementById('xColVal').value;
	
	var yColumns = [];
	var xColumn = '';
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
	
	if (!isNaN(parseInt(xColStr))){ xColumn = parseInt(xColStr);}
	
	
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
	else if (optionname == 'stepSizeX' || optionname == 'stepSizeY'){
		var newoption = document.querySelector('input[name='+optionname+']').value;
		var jsonmessage = {'operation':'options','stepSize':{}};
		if (optionname == 'stepSizeX') {jsonmessage['stepSize']['x']=newoption;}
		else if (optionname == 'stepSizeY') {jsonmessage['stepSize']['y']=newoption;}
		ws.send(JSON.stringify(jsonmessage));
	}
	else if (optionname == 'shape' || optionname == 'dash' || optionname == 'lineName'){

		var parentEl = document.querySelector("#lineStyleDiv"+colid);
		
		var el = parentEl.querySelector('input[name='+optionname+colid+']:checked');
		if (optionname == 'lineName'){
			el = parentEl.querySelector('input[name='+optionname+colid+']')
		}
		var newoption = el.value;
		var jsonmessage = {'operation':'options','lines':[{'id':colid}]};

		if (optionname != 'lineName'){
			jsonmessage['lines'][0][optionname]=newoption;
		}
		else {
			jsonmessage['lines'][0]['name']=newoption;
		}
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
	var nsteps = parseInt(el.getAttribute('name'));
	var jsonmessage = {'operation':'options','nsteps':nsteps};
	ws.send(JSON.stringify(jsonmessage));
}
function modifierChg(initial=false) {
	var el = document.getElementById('rawModified');
	el.innerHTML = '';
	var addedRaw = false;
	var idx = 1;
	for (var i in modifiers){
		if (modifiers[i].enabled){
			if (!addedRaw){
				var newEl = document.createElement('a');
				newEl.textContent = 'R';
				newEl.setAttribute('name',0);
				newEl.addEventListener('click',chgStep);
				el.appendChild(newEl);
				addedRaw = true;
			}
			var newEl = document.createElement('a');
			newEl.textContent = idx;
			newEl.setAttribute('name',idx);
			newEl.addEventListener('click',chgStep);
			el.appendChild(newEl);
			idx++;
		}
	}
	if (!initial){
		var jsonmessage = {'operation':'options','modifiers':modifiers};
		ws.send(JSON.stringify(jsonmessage));
	}
}
function typeChg() {
	var isChecked = document.querySelector('#chartTypeMenu > option:checked');

	var jsonmessage = {'operation':'options','type':isChecked.value};
	ws.send(JSON.stringify(jsonmessage));
}

function updateModifiedTable(data) {
	var dataTable = document.getElementById("dataTableModified");
	dataTable.style.display = 'inline-block';
	dataTable.style.maxWidth = '100%';

	dataTable.innerHTML = '';
	headers = [];
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
	updateHeaders(false,true);
}

function dataChg(initialData=false,dataType='csv') {
	
	var dataTable = document.getElementById("dataTable");
	var csv = dataCopy.value;
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
	dataTable.innerHTML = '';
	headers = [];
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
	modifierChg(initialData);
	updateHeaders(initialData);
	
	
	
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
		ell.parentNode.removeChild(ell);
		
		qstring = '#lineStyleDiv'+el.id.substring(5);
		ell = document.getElementById("yAxisFormatBox").querySelector(qstring);
		ell.parentNode.removeChild(ell);
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
				var allVars = el.parentNode.parentNode.querySelector('#allVariables');
				for (var ii in modifiers[i].options.variables){
					var objVar = modifiers[i].options.variables[ii];
					var qstring = 'div[name='+ii+']';
					var newEl = allVars.querySelector(qstring);
					if (cols){
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
			var ell = el.parentNode.querySelector('.pivotColumns').children;
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
	var id = evt.target.parentNode.parentNode.id;
	var el = evt.target;
	if (!id || id.substring(0,4) != 'edit'){
		id = evt.target.parentNode.parentNode.parentNode.id;
	}
	if (!id || id.substring(0,4) != 'edit'){
		id = evt.target.parentNode.parentNode.parentNode.parentNode.id;
	}
	if (!id || id.substring(0,4) != 'edit'){
		id = evt.target.parentNode.parentNode.parentNode.parentNode.parentNode.id;
	}
	if (el.getAttribute('name') == null || el.getAttribute('name') == ''){
		el = evt.target.parentNode;
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
				var ell = el.parentNode.parentNode;
				ell.parentNode.removeChild(ell);
				//remove from database
				modifiers.splice(i,1);
				modifierChg();
				return;
			}
			else if (el.getAttribute('name')=='disable'){
				modifiers[i].enabled = false;
				el.textContent = 'Enable';
				el.setAttribute('name','enable');
				
				var listEl = document.getElementById(modifiers[i].id);
				listEl.style.textDecoration = 'line-through';
				listEl.style.color = 'rgb(50,50,50)';
				modifierChg();
				return;
			}
			else if (el.getAttribute('name')=='enable'){
				modifiers[i].enabled = true;
				el.textContent = 'Disable';
				el.setAttribute('name','disable');
				
				var listEl = document.getElementById(modifiers[i].id);
				listEl.style.textDecoration = 'none';
				listEl.style.color = 'inherit';
				modifierChg();
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
					var pType = el.parentNode.querySelector('select[name=pType] > option:checked').value;
					var column = parseInt(el.parentNode.querySelector('select[name="column"]').value);
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
					el.parentNode.querySelector('div.pivotColumns').appendChild(newEl);
				}
			}
			else if (mType == 'sort'){
				if (el.getAttribute('name')=='column'){
					//modifiers[i].options.type = evt.target.querySelector('option:checked').value;
					modifiers[i].options.column = parseInt(el.value);
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
				if (el.getAttribute('name')=='formula'){
					modifiers[i].options.formula = el.value;
					var ell = el.parentNode.querySelector('div[name=katex]');
					katex.render(modifiers[i].options.formula, ell, {
						throwOnError: false
					});
				}
				else if (el.getAttribute('data-type')=='showVar'){
					var varName = el.getAttribute('name');
					var ell = el.parentNode.parentNode.querySelector('#newVariables');
					for (var ii in modifiers[i].options.variables){
						if (ii == varName){
							ell.querySelector('input[name=name]').value = varName;
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
					el.parentNode.parentNode.parentNode.parentNode.querySelector('span[name=title]').textContent = 'New Column: '+el.value;
				}
				else if (evt.target.getAttribute('name')=='add'){
					var ell = el.parentNode;
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
					var name = ell.querySelector('input[name=name]').value;
					modifiers[i].options.variables[name] = newVariable;
					
					var elll = ell.parentNode.querySelector('#allVariables');
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
					var ell = el.parentNode;
					var nameEl = ell.querySelector('input[name=name]');
					var name = nameEl.value;
					nameEl.value = '';
					ell.querySelector('select[name=type]').value = 'value';
					var id = modifiers[i].id;
					ell.querySelector('#newcolVar'+id).value = '0';
					ell.querySelector('#value'+id).style.display = 'block';
					ell.querySelector('#group'+id).style.display = 'none';
					ell.querySelector('#currentRow'+id).checked = true;
					delete modifiers[i].options.variables[name];
					
					var elll = ell.parentNode.querySelector('#allVariables');
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

	modifierChg();
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
				document.getElementById('rawModified').querySelector(qstring).style.color='white';
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
				document.getElementById('rawModified').querySelector(qstring).style.color='yellow';
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

function createMButtons(newH,enabled) {
	var newSpan = document.createElement('span');
	newSpan.setAttribute('name','delete');
	newSpan.classList.add('box-buttons');
	var newIcon = document.createElement('i');
	newIcon.classList.add('fas');
	newIcon.classList.add('fa-trash');
	newSpan.appendChild(newIcon);
	newSpan.addEventListener('click',updateModifier);
	newH.appendChild(newSpan);
	newSpan = document.createElement('span');
	if (enabled){
		newSpan.setAttribute('name','disable');
		newSpan.classList.add('box-buttons');
		newSpan.textContent = 'Disable';
	}
	else {
		newSpan.setAttribute('name','enable');
		newSpan.classList.add('box-buttons');
		newSpan.textContent = 'Enable';
	}
	newSpan.addEventListener('click',updateModifier);
	newH.appendChild(newSpan);
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
		
	var newM = document.createElement('div');
	newM.classList.add('l-box');
	newM.classList.add('pure-u-2-3');
	newM.id = 'edit'+obj.id;
	newM.style.display = 'none';
	
	var newH = document.createElement('div');
	newH.classList.add('box-header2');
	var newI = document.createElement('input');
	newI.setAttribute('type','text');
	newI.setAttribute('value','Pivot');
	newH.appendChild(newI);
	createMButtons(newH,obj.enabled);
	newM.appendChild(newH);
	
	var newB = document.createElement('div');
	newB.classList.add('box-form');
	newI = document.createElement('select');
	newI.id = 'pivotcol'+obj.id;
	newI.setAttribute('name','pivot');
	newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	var newD = document.createElement('div');
	newD.classList.add('pivotColumns');
	newD.style.paddingTop = '1rem';
	newD.style.paddingBottom = '1rem';
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
	
	newB.appendChild(newD);
	newI = document.createElement('select');
	newI.id = 'colcol'+obj.id;
	newI.setAttribute('name','column');
	//newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	newS = document.createElement('select');
	newS.setAttribute('name','pType');
	//newS.addEventListener('change',updateModifier);
	var pTypes = ['Sum','Max','Min','Mean','Count'];
	for (var i=0;i<pTypes.length;i++){
		var newO = document.createElement('option');
		newO.setAttribute('value',pTypes[i].toLowerCase());
		newO.textContent = pTypes[i];
		if (pTypes[i].toLowerCase() == obj.options.type){
			newO.setAttribute('selected','selected');
		}
		newS.appendChild(newO);
	}
	newB.appendChild(newS);
	
	newS = document.createElement('button');
	newS.setAttribute('name','add');
	newS.textContent = 'Add';
	newS.addEventListener('click',updateModifier);
	newS.classList.add('pure-button');
	newS.classList.add('pure-button-primary');
	newB.appendChild(newS);
	newM.appendChild(newB);
	document.getElementById('modifyDataBox').appendChild(newM);
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
		
	var newM = document.createElement('div');
	newM.classList.add('l-box');
	newM.classList.add('pure-u-2-3');
	newM.id = 'edit'+obj.id;
	newM.style.display = 'none';
	
	var newH = document.createElement('div');
	newH.classList.add('box-header2');
	var newI = document.createElement('input');
	newI.setAttribute('type','text');
	newI.setAttribute('value','Name of Modifier');
	newH.appendChild(newI);
	createMButtons(newH,obj.enabled);
	newM.appendChild(newH);

	var newB = document.createElement('div');
	newB.classList.add('box-form');
	newI = document.createElement('input');
	newI.setAttribute('type','text');
	newI.setAttribute('name','find');
	newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	newI = document.createElement('input');
	newI.setAttribute('type','text');
	newI.setAttribute('name','replace');
	newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	newI = document.createElement('input');
	newI.setAttribute('type','checkbox');
	newI.setAttribute('name','case');
	newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	newI = document.createElement('input');
	newI.setAttribute('type','checkbox');
	newI.setAttribute('name','numerical');
	newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	newI = document.createElement('input');
	newI.setAttribute('type','checkbox');
	newI.setAttribute('name','full');
	newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	newI = document.createElement('select');
	newI.setAttribute('name','column');
	newI.id = 'replaceCol'+obj.id;
	newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	newM.appendChild(newB);
	document.getElementById('modifyDataBox').appendChild(newM);
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
		
	var newM = document.createElement('div');
	newM.classList.add('l-box');
	newM.classList.add('pure-u-2-3');
	newM.id = 'edit'+obj.id;
	newM.style.display = 'none';
	
	var newH = document.createElement('div');
	newH.classList.add('box-header2');
	var newI = document.createElement('input');
	newI.setAttribute('type','text');
	newI.setAttribute('value','Sort by ...');
	newH.appendChild(newI);
	createMButtons(newH,obj.enabled);
	newM.appendChild(newH);
						
	var newB = document.createElement('div');
	newB.classList.add('box-form');
	newI = document.createElement('select');
	newI.setAttribute('name','column');
	newI.id = 'sortcol'+obj.id;
	newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	newI = document.createElement('input');
	newI.setAttribute('type','checkbox');
	if (!obj.options.ascending){
		newI.setAttribute('checked','checked');
	}
	newI.setAttribute('name','descending');
	newI.addEventListener('change',updateModifier);
	newB.appendChild(newI);
	
	newM.appendChild(newB);
	document.getElementById('modifyDataBox').appendChild(newM);
}

// New Columns stuff
function createNewColumnBox(id) {
	var el = document.getElementById('edit'+id);
	var varDiv = el.querySelector('#newVariables');
	var varName = document.createElement('input');
	varName.setAttribute('type','text');
	varName.setAttribute('name','name');
	varDiv.appendChild(varName);
	
	var span1 = document.createElement('span');
	span1.textContent = ' := ';
	varDiv.appendChild(span1);
	
	var varValue = document.createElement('select');
	varValue.setAttribute('name','type');
	var valueOptions = ['value','mean','median','max','min','sum','stdev','count'];
	for (var i=0;i<valueOptions.length;i++){
		var varOption = document.createElement('option');
		varOption.value = valueOptions[i];
		varOption.textContent = valueOptions[i];
		varValue.appendChild(varOption);
	}
	varValue.addEventListener('change',updateModifier);
	varDiv.appendChild(varValue);
	
	var span2 = document.createElement('span');
	span2.textContent = ' of ';
	varDiv.appendChild(span2);
	
	var varColumn = document.createElement('select');
	varColumn.setAttribute('name','column');
	varColumn.id = 'newcolVar'+id;
	
	var valueOptions = [0,1,2];
	for (var i=0;i<valueOptions.length;i++){
		var varOption = document.createElement('option');
		varOption.value = valueOptions[i];
		varOption.textContent = 'Column '+valueOptions[i];
		varColumn.appendChild(varOption);
	}
	varDiv.appendChild(varColumn);
	
	var valueDiv = document.createElement('div');
	valueDiv.id = 'value'+id;
	var newDiv = document.createElement('div');
		
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','row'+id);
		varR.setAttribute('checked','checked');
		varR.setAttribute('value','current');
		varR.id = 'currentRow'+id;
			
		var varRL = document.createElement('label');
		varRL.textContent = 'Current Row';
		varRL.setAttribute('for','currentRow'+id);
			
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	valueDiv.appendChild(newDiv);
	newDiv = document.createElement('div');
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','row'+id);
		varR.setAttribute('value','previous');
		varR.id = 'previousRow'+id;
		
		var varRL = document.createElement('label');
		var varRN = document.createElement('input');
		varRN.setAttribute('type','number');
		varRN.setAttribute('name','prevn');
		varRN.setAttribute('value','1');
		varRN.style.width = '4rem';
		varRL.appendChild(varRN);
		var varRS = document.createElement('span');
		varRS.textContent = ' Row Before';
		varRL.appendChild(varRS);
		varRL.setAttribute('for','previousRow'+id);
		
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	valueDiv.appendChild(newDiv);
	newDiv = document.createElement('div');
		
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','row'+id);
		varR.setAttribute('value','next');
		varR.id = 'nextRow'+id;
		
		var varRL = document.createElement('label');
		var varRN = document.createElement('input');
		varRN.setAttribute('type','number');
		varRN.setAttribute('name','aftern');
		varRN.setAttribute('value','1');
		varRN.style.width = '4rem';
		varRL.appendChild(varRN);
		var varRS = document.createElement('span');
		varRS.textContent = ' Row After';
		varRL.appendChild(varRS);
		varRL.setAttribute('for','nextRow'+id);
		
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	valueDiv.appendChild(newDiv);
	newDiv = document.createElement('div');
		
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','row'+id);
		varR.setAttribute('value','equal');
		varR.id = 'equalRow'+id;
		
		var varRL = document.createElement('label');
		var varRI = document.createElement('input');
		varRI.setAttribute('type','text');
		varRI.setAttribute('name','equalrow');
		varRL.textContent = 'Row = ';
		varRL.appendChild(varRI);
		varRL.setAttribute('for','equalRow'+id);
		
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	valueDiv.appendChild(newDiv);
	varDiv.appendChild(valueDiv);
	
	var groupDiv = document.createElement('div');
	groupDiv.id = 'group'+id;
	var newDiv = document.createElement('div');
		
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','rowstart'+id);
		varR.setAttribute('value','equal');
		varR.setAttribute('checked','checked');
		varR.id = 'equalRowstart'+id;
		
		var varRL = document.createElement('label');
		var varRI = document.createElement('input');
		varRI.setAttribute('type','text');
		varRI.setAttribute('name','equalrowstart');
		varRI.setAttribute('value','0');
		varRL.textContent = 'From Row = ';
		varRL.appendChild(varRI);
		varRL.setAttribute('for','equalRowstart'+id);
		
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	groupDiv.appendChild(newDiv);
	newDiv = document.createElement('div');
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','rowstart'+id);
		varR.setAttribute('value','previous');
		varR.id = 'previousRowstart'+id;
		
		var varRL = document.createElement('label');
		var varRN = document.createElement('input');
		varRN.setAttribute('type','number');
		varRN.setAttribute('name','prevnstart');
		varRN.setAttribute('value','1');
		varRN.style.width = '4rem';
		varRL.appendChild(varRN);
		var varRS = document.createElement('span');
		varRS.textContent = ' Row Before';
		varRL.appendChild(varRS);
		varRL.setAttribute('for','previousRowstart'+id);
		
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	groupDiv.appendChild(newDiv);
	newDiv = document.createElement('div');
		
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','rowstart'+id);
		varR.setAttribute('value','next');
		varR.id = 'nextRowstart'+id;
		
		var varRL = document.createElement('label');
		var varRN = document.createElement('input');
		varRN.setAttribute('type','number');
		varRN.setAttribute('name','afternstart');
		varRN.setAttribute('value','0');
		varRN.style.width = '4rem';
		varRL.appendChild(varRN);
		var varRS = document.createElement('span');
		varRS.textContent = ' Row After';
		varRL.appendChild(varRS);
		varRL.setAttribute('for','nextRowstart'+id);
		
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	groupDiv.appendChild(newDiv);
	
	newDiv = document.createElement('div');
		
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','rowend'+id);
		varR.setAttribute('value','equal');
		varR.setAttribute('checked','checked');
		varR.id = 'equalRowend'+id;
		
		var varRL = document.createElement('label');
		var varRI = document.createElement('input');
		varRI.setAttribute('type','text');
		varRI.setAttribute('name','equalrowend');
		varRI.setAttribute('value','-1');
		varRL.textContent = 'To Row = ';
		varRL.appendChild(varRI);
		varRL.setAttribute('for','equalRowend'+id);
		
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	groupDiv.appendChild(newDiv);
	newDiv = document.createElement('div');
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','rowend'+id);
		varR.setAttribute('value','previous');
		varR.id = 'previousRowend'+id;
		
		var varRL = document.createElement('label');
		var varRN = document.createElement('input');
		varRN.setAttribute('type','number');
		varRN.setAttribute('name','prevnend');
		varRN.setAttribute('value','1');
		varRN.style.width = '4rem';
		varRL.appendChild(varRN);
		var varRS = document.createElement('span');
		varRS.textContent = ' Row Before';
		varRL.appendChild(varRS);
		varRL.setAttribute('for','previousRowend'+id);
		
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	groupDiv.appendChild(newDiv);
	newDiv = document.createElement('div');
		
		var varR = document.createElement('input');
		varR.setAttribute('type','radio');
		varR.setAttribute('name','rowend'+id);
		varR.setAttribute('value','next');
		varR.id = 'nextRowend'+id;
		
		var varRL = document.createElement('label');
		var varRN = document.createElement('input');
		varRN.setAttribute('type','number');
		varRN.setAttribute('name','afternend');
		varRN.setAttribute('value','0');
		varRN.style.width = '4rem';
		varRL.appendChild(varRN);
		var varRS = document.createElement('span');
		varRS.textContent = ' Row After';
		varRL.appendChild(varRS);
		varRL.setAttribute('for','nextRowend'+id);
		
		newDiv.appendChild(varR);
		newDiv.appendChild(varRL);
	groupDiv.appendChild(newDiv);
	groupDiv.style.display = 'none';
	varDiv.appendChild(groupDiv);
	
	var varB = document.createElement('button');
	varB.setAttribute('name','add');
	varB.textContent = 'Add';
	varB.addEventListener('click',updateModifier);
	varB.classList.add('pure-button');
	varB.classList.add('pure-button-primary');
	varDiv.appendChild(varB);
	
	varB = document.createElement('button');
	varB.setAttribute('name','clear');
	varB.textContent = 'Clear';
	varB.addEventListener('click',updateModifier);
	varB.classList.add('pure-button');
	varB.classList.add('pure-button-primary');
	varDiv.appendChild(varB);
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
function createNew(obj) {
	var newEl = document.createElement('div');
	newEl.setAttribute('data-id',obj.type);
	newEl.textContent = obj.name;
	newEl.addEventListener('click',clickModifier);
	newEl.classList.add('hoverClick');
	if (!obj.enabled){newEl.style.textDecoration = 'line-through';}
	newEl.id = obj.id;
	document.getElementById('allModifiers').appendChild(newEl);
		
	var newM = document.createElement('div');
	newM.classList.add('l-box');
	newM.classList.add('pure-u-2-3');
	newM.id = 'edit'+obj.id;
	newM.style.display = 'none';
	
	var newH = document.createElement('div');
	newH.classList.add('box-header2');
	var newT = document.createElement('span');
	newT.textContent = 'New Column: ' + obj.name;
	newT.setAttribute('name','title');
	newH.appendChild(newT);
	createMButtons(newH,obj.enabled);
	
	newM.appendChild(newH);
	
	var ideal = `<div class="box-form">
		Formula: <textarea rows="1" cols="40"></textarea><br />
		<!--Katex of Formula-->
		Variables: <div id="newVariables"></div>
	</div>`;

						
	var newB = document.createElement('div');
	newB.classList.add('box-form');
	var newBB = document.createElement('div');
	newBB.classList.add('pure-g');
	
	var newBBB = document.createElement('div');
	newBBB.classList.add('pure-u-1-3');
	
	var newI = document.createElement('input');
	newI.setAttribute('type','text');
	newI.setAttribute('name','name');
	newI.setAttribute('value',obj.name);
	newI.addEventListener('change',updateModifier);
	newBBB.appendChild(newI);
	
	newI = document.createElement('textarea');
	newI.setAttribute('rows','1');
	newI.setAttribute('cols','30');
	newI.style.zIndex = '2';
	newI.setAttribute('name','formula');
	newI.value = obj.options.formula;
	newI.addEventListener('change',updateModifier);
	newBBB.appendChild(newI);
	newI = document.createElement('div');
	newI.setAttribute('name','katex');
	katex.render(obj.options.formula, newI, {
		throwOnError: false
	});
	newBBB.appendChild(newI);
	newBB.appendChild(newBBB);
	

	
	newBBB = document.createElement('div');
	newBBB.classList.add('pure-u-2-3');
	var newD = document.createElement('div');
	newD.id = 'allVariables';
	for (var i in obj.options.variables){
		var objVar = obj.options.variables[i];
		var newEl = document.createElement('div');
		
		
		newEl.setAttribute('name',i);
		newEl.setAttribute('data-type','showVar');
		newEl.addEventListener('click',updateModifier);
		newEl.classList.add('hoverClick');
		newD.appendChild(newEl);
	}
	newBBB.appendChild(newD);
	
	newD = document.createElement('div');
	newD.id = 'newVariables';
	newBBB.appendChild(newD);
	newBB.appendChild(newBBB);
	
	newB.appendChild(newBB);
	newM.appendChild(newB);
	
	document.getElementById('modifyDataBox').appendChild(newM);
	createNewColumnBox(obj.id);
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
		
		modifierChg();
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

		modifierChg();
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
	}
	else if (boxid == 'dataSource' && minimizedBoxes[boxid]== 'small'){
		var el = document.getElementById('dataSourceBox');
		el.style.display = 'block';
		var otherEl = document.getElementById('dataTableHolder');
		otherEl.classList.remove('pure-u-1-1');
		otherEl.classList.add('pure-u-3-4');
		minimizedBoxes[boxid] = 'large';
		document.getElementById('editSource').style.display = 'none';
	}
	else if (boxid == 'dataTable' || boxid == 'modifyData' || boxid == 'createChart' || boxid == 'customChart'){
		if (minimizedBoxes[boxid] == 'large'){
			var el = document.getElementById(boxid+'Box');
			el.style.display = 'none';
			minimizedBoxes[boxid] = 'small';
			var elp = el.parentNode;
			elp.classList.add('l-box-thin');
			elp.classList.remove('l-box-half');
			var ell = elp.querySelector('.box-header i.fa-compress-alt');
			ell.classList.remove('fa-compress-alt');
			ell.classList.add('fa-expand-alt');
			
		}
		else {
			var el = document.getElementById(boxid+'Box');
			el.style.display = 'block';
			minimizedBoxes[boxid] = 'large';
			var elp = el.parentNode;
			elp.classList.add('l-box-half');
			elp.classList.remove('l-box-thin');
			var ell = elp.querySelector('.box-header i.fa-expand-alt');
			ell.classList.add('fa-compress-alt');
			ell.classList.remove('fa-expand-alt');
		}
	}
	else if (boxid == 'chartjs' || boxid == 'plotly' || boxid == 'xkcd' || boxid == 'google'){
		if (full){
			var el = document.getElementById(boxid+'Box');
			el.classList.add('pure-u-1-1');
			el.classList.remove('pure-u-1-2');
			el.style.display = 'block';
			minimizedBoxes[boxid] = 'full';
			var el2 = document.getElementById(boxid+'None');
			el2.style.display = 'none';
		}
		else if (minimizedBoxes[boxid] == 'full') {
			var el = document.getElementById(boxid+'Box');
			el.classList.add('pure-u-1-2');
			el.classList.remove('pure-u-1-1');
			el.style.display = 'block';
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
		el.parentNode.querySelector('button[name=showMore]').textContent = 'Show More Options';
		el.parentNode.querySelector('button[name=showMore]').setAttribute('onclick','showMoreOptions(false)');
	}
	else {
		el.style.display = 'block';
		el.parentNode.querySelector('button[name=showMore]').textContent = 'Hide Options';
		el.parentNode.querySelector('button[name=showMore]').setAttribute('onclick','showMoreOptions(true)');
	}
}




