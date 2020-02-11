
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
		updateModifiedTable(dm.mdata);
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
var lineId = 0;
var dataSourceSize = 'large';

// Change Tab of which line to style
function chgLineTab(){

	lineId = document.getElementById('lineStyleMenu').querySelector('*:checked').value;
	if (lineId == -1){lineId = 0;}
	var colid = yColsVals[lineId];
	
	var lineDivs = document.getElementById('lineStyleDivs').children;
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
function createLineDiv(id) {
	var el = document.createElement('div');
	el.id = "lineStyleDiv"+id;
	el.innerHTML = `
		Name: <input type="text" name="lineName" onchange="optionsChg('lineName')" placeholder="default"/>
		Line Color(s): <input type="text" name="lineColor" onchange="optionsChg('lineColor')" placeholder="default"/>
		Dot Color(s): <select><option>Match Line</option><option>None</option><option>Custom</option></select><input type="text" name="dotColor" placeholder="default"/>
		<input type="radio" name="shape`+id+`" onchange="optionsChg('shape')" value="default" checked>Default</input>
		<input type="radio" name="shape`+id+`" onchange="optionsChg('shape')" value="spline">Smooth</input>
		<input type="radio" name="shape`+id+`" onchange="optionsChg('shape')" value="linear">Linear</input><br />
		<input type="radio" name="dash`+id+`" onchange="optionsChg('dash')" value="solid" checked>Solid</input>
		<input type="radio" name="dash`+id+`" onchange="optionsChg('dash')" value="dash">Dash</input>
		<input type="radio" name="dash`+id+`" onchange="optionsChg('dash')" value="dot">Dot</input>
		<input type="radio" name="dash`+id+`" onchange="optionsChg('dash')" value="dashdot">DashDot</input>`;
	document.getElementById("lineStyleDivs").appendChild(el);
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
	var menu = document.getElementById('lineStyleMenu');
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
		if (i >= menu.children.length - 1){
			var el = document.createElement('option');
			el.value = i;
			el.textContent = i;
			menu.appendChild(el);
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
		var colid = yColsVals[lineId];
		var parentEl = document.querySelector("#lineStyleDiv"+colid);
		
		var el = parentEl.querySelector('input[name='+optionname+']:checked');
		if (optionname == 'lineName'){
			el = parentEl.querySelector('input[name='+optionname+']')
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
function modifierChg() {
	var jsonmessage = {'operation':'options','modifiers':modifiers};
	ws.send(JSON.stringify(jsonmessage));
}
function typeChg() {
	var isChecked = document.querySelector('#chartTypeMenu > option:checked');

	var jsonmessage = {'operation':'options','type':isChecked.value};
	ws.send(JSON.stringify(jsonmessage));
}

function updateModifiedTable(data) {
	var dataTable = document.getElementById("dataTableModified");
	dataTable.style.display = 'block';


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
		var menu = document.getElementById('lineStyleMenu');
		for (var yid in yColsVals){
			createLineDiv(yColsVals[yid]);
			if (yid >= menu.children.length - 1){
				var el = document.createElement('option');
				el.value = yid;
				el.textContent = yid;
				menu.appendChild(el);
			}
			
			yColsVals[yid] = parseInt(yColsVals[yid]);
			ycvStr += yColsVals[yid]+', ';
			var newColumn = document.createElement('span');
			newColumn.textContent = headers[yColsVals[yid]];
			newColumn.id = 'colId'+yColsVals[yid];
			newColumn.style.display = 'block';
			document.getElementById('yColumns').appendChild(newColumn);
		}
		chgLineTab();
		chgModify();
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

drake.on('drop', function (el, target, source, sibling) { 
	if (target.id == 'xColumn') {
		target.innerHTML = ''; target.appendChild(el);
		document.getElementById('xColVal').value = el.id.substring(5);
		columnsChg();
	}
	else if (target.id == 'yColumns') {
		var elid = el.id.substring(5);
		if (!sibling){
			
			var ycvStr = '';
			var oldId = -1;
			for (var yid in yColsVals){
				if (elid != yColsVals[yid]){
					ycvStr += yColsVals[yid]+', ';
				}
				else {
					oldId = yid;
				}
			}
			if (oldId != -1){yColsVals.splice(oldId,1);}
			else {createLineDiv(elid);}
			
			yColsVals.push(elid);
			ycvStr += elid+', ';
			document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
			columnsChg();
		}
		else {
			var sibid = sibling.id.substring(5);
			var ycvStr = '';
			var oldId = -1;
			for (var yid in yColsVals){
				if (elid == yColsVals[yid]){
					oldId = yid;
				}
			}
			if (oldId != -1){yColsVals.splice(oldId,1);}
			else {createLineDiv(elid);}
			
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
			document.getElementById('yColsVal').value = ycvStr.substring(0,ycvStr.length-2);
			columnsChg();
		}
		
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

// New Columns stuff
function createNewColumnBox() {
	var el = document.getElementById('newModify');
	var varDiv = el.querySelector('#newVariables');
	var varName = document.createElement('input');
	varName.setAttribute('type','text');
	varDiv.appendChild(varName);
	
	var span1 = document.createElement('span');
	span1.textContent = ' := ';
	varDiv.appendChild(span1);
	
	var varValue = document.createElement('select');
	var valueOptions = ['value','mean','median','max','min','sum','stdev','count'];
	for (var i=0;i<valueOptions.length;i++){
		var varOption = document.createElement('option');
		varOption.value = valueOptions[i];
		varOption.textContent = valueOptions[i];
		varValue.appendChild(varOption);
	}
	varDiv.appendChild(varValue);
	
	var span2 = document.createElement('span');
	span2.textContent = ' of ';
	varDiv.appendChild(span2);
	
	var varColumn = document.createElement('select');
	var valueOptions = [0,1,2];
	for (var i=0;i<valueOptions.length;i++){
		var varOption = document.createElement('option');
		varOption.value = valueOptions[i];
		varOption.textContent = 'Column '+valueOptions[i];
		varColumn.appendChild(varOption);
	}
	varDiv.appendChild(varColumn);
}
createNewColumnBox();


//Dragula with column choices
function chgModify(mObject={}){
	var allTypes = ['sort','pivot','new','scale','replace','ignore'];
	var mType = '';
	if (mObject.type) {mType = mObject.type;}

	for (var t in allTypes){
		if (allTypes[t] == mType){
			document.getElementById(mType+'Modify').style.display = 'block';
		}
		else {
			document.getElementById(allTypes[t]+'Modify').style.display = 'none';
		}
		
	}
}
function clickModifier(evt){
	var id = '';
	if (evt.target){id = evt.target.id;}
	else {id = evt;}
	for (var i in modifiers){
		if (modifiers[i].id==id){
			//modifiers['enabled'][i]['options']['x']=7;
			var mType = modifiers[i].type;
			chgModify(modifiers[i]);
			return;

		}
	}
}
function createNewModifier() {
	var el = document.getElementById('createModifyMenu');
	var ell = el.querySelector('option:checked');
	var mType = '';
	if (ell && ell.value != ''){
		mType = ell.value;
		var id = Math.random().toString(36).substr(2, 8);
		var oldObject = {'id':id,'name':'','type':mType,'options':{},'enabled':true};
		if (mType == 'new'){
			oldObject.options = {'formula':'a+b','variables':{'a':{'column':1,'type':'value','row':'0'}, 'b':{'column':2,'type':'value','row':'0'}}};
		}
		else if (mType == 'sort'){
			oldObject.options = {'column':1,'ascending':true};
		}
		else if (mType == 'replace'){
			oldObject.options = {'column':1,'find':'7','replace':'8','regex':false,'full':false,'case':false,'numerical':false};
		}
		else if (mType == 'ignore'){
			oldObject.options = {'expression':''};
		}
		else if (mType == 'scale'){
			oldObject.options = {'column':0,'scale':''};
		}
		else if (mType == 'pivot'){
			oldObject.options = {'pivot':0,'columns':[1],'type':'sum'};
		}
		modifiers.push(oldObject);
		var newEl = document.createElement('div');
		newEl.setAttribute('data-id',mType);
		newEl.textContent = mType;
		newEl.addEventListener('click',clickModifier);
		newEl.id = id;
		document.getElementById('allModifiers').appendChild(newEl);
		chgModify(oldObject);
		modifierChg();
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
		
		chgModify(oldObject);
		

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



// Minimize and Maximize elements
function minimizeBox(boxid){
	if (boxid == 'dataSource' && dataSourceSize == 'large'){
		var el = document.getElementById('dataSourceBox');
		el.classList.add('pure-u-1-1');
		el.classList.remove('pure-u-1-4');
		el.querySelector('form').style.display = 'none';
		el.querySelector('i').classList.remove('fa-compress-alt');
		el.querySelector('i').classList.add('fa-expand-alt');
		var otherEl = document.getElementById('dataTableBox');
		otherEl.classList.add('pure-u-1-1');
		otherEl.classList.remove('pure-u-3-4');
		dataSourceSize = 'small';
	}
	else if (boxid == 'dataSource' && dataSourceSize == 'small'){
		var el = document.getElementById('dataSourceBox');
		el.classList.remove('pure-u-1-1');
		el.classList.add('pure-u-1-4');
		el.querySelector('form').style.display = 'block';
		el.querySelector('i').classList.add('fa-compress-alt');
		el.querySelector('i').classList.remove('fa-expand-alt');
		var otherEl = document.getElementById('dataTableBox');
		otherEl.classList.remove('pure-u-1-1');
		otherEl.classList.add('pure-u-3-4');
		dataSourceSize = 'large';
	}
}




