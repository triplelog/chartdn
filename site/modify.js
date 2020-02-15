var fsort = require('fast-sort');

function makePost(infixexpr) {
	prec = {}
	prec["*"] = 4
	prec["/"] = 4
	prec["+"] = 3
	prec["~"] = 3
	prec[">"] = 2
	prec["<"] = 2
	prec["="] = 2
	prec["!"] = 2
	prec["["] = 2
	prec["]"] = 2
	prec["&"] = 1
	prec["|"] = 0
	prec["("] = -1
	opStack = []
	postfixList = []
	intstr = []
	expstr = []
	tokenList = []
	temptoken = ''
	for (var i=0;i<infixexpr.length;i++){
		var ie = infixexpr[i];
		if ("-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(ie) > -1){
			temptoken += ie
		}
		else{
			if (temptoken != ''){
				tokenList.push(temptoken)
			}
			tokenList.push(ie)
			temptoken = ''
		}
	}
	if (temptoken != ''){
		tokenList.push(temptoken)
	}
	
	for (var i=0;i<tokenList.length;i++){
		var token = tokenList[i];
		if ("*/+~><=![]&|()".indexOf(token) == -1){
			postfixList.push(token)
		}
		else if (token == '('){
			opStack.push(token)
		}
		else if (token == ')'){
			topToken = opStack.pop()
			while (topToken != '('){
				postfixList.push(topToken)
				topToken = opStack.pop()
			}
		}
		else {
			while ((opStack.length > 0) && (prec[opStack[opStack.length-1]] >= prec[token])){
				postfixList.push(opStack.pop())
			}
			opStack.push(token)
		}
	}
	while (opStack.length > 0){
		postfixList.push(opStack.pop())
	}
	for (var i=0;i<postfixList.length;i++){
		var ci = postfixList[i];
		if ("*/+~><=![]&|".indexOf(ci) == -1){
			intstr.push(ci);
			expstr.push('#');
		}
		else if (ci == '~'){
			expstr.push('-');
		}
		else{
			expstr.push(ci);
		}
	}
	return [intstr,expstr]

}

function replaceDecimals(istr){
	dindex = istr.indexOf('.');
	while (dindex >-1){
		intpart = 0;
		decpart = 0;
		denom = 1;
		strparts = [dindex,dindex+1];
		for (var i=1;i<dindex+1;i++){
			if ("0123456789".indexOf(istr[dindex-i]) > -1){
				intpart += parseInt(istr[dindex-i])*Math.pow(10,i-1);
				strparts[0] = dindex-i;
			}
			else{break;}
		}
		for (var i=dindex+1;i<istr.length;i++){
			if ("0123456789".indexOf(istr[i]) > -1){
				decpart *=10;
				denom *=10;
				decpart += parseInt(istr[i]);
				strparts[1] = i+1;
			}
			else{break;}
		}
		istr = istr.substring(0,strparts[0])+'('+ (intpart*denom+decpart) +'/'+ denom +')'+istr.substring(strparts[1],);
		dindex = istr.indexOf('.');
	}

	return istr
}

function replaceNegatives(istr){
	dindex = istr.indexOf('-')
	while (dindex >-1){
		if (dindex == 0){
			if ("0123456789".indexOf(istr[1]) == -1) {
				istr = '-1*'+istr.substring(1,);
			}
			dindex = istr.indexOf('-',1);
		}
		else{
			if ("><=![]&|(".indexOf(istr[dindex-1])> -1) {
				if ("0123456789".indexOf(istr[dindex-1])== -1){
					istr = istr.substring(0,dindex)+'-1*'+istr.substring(dindex+1,);
				}
				dindex = istr.indexOf('-',dindex+1);
			}
			else{
				istr = istr.substring(0,dindex)+'~'+istr.substring(dindex+1,);
				dindex = istr.indexOf('-',dindex+1);
			}
		}
	}
				
	return istr
}

function postfixify(input_str) {
	input_str = input_str.toUpperCase();
	input_str = input_str.replace(/\s/g,'');
	input_str = input_str.replace(/AND/g,'&');
	input_str = input_str.replace(/OR/g,'|');
	input_str = input_str.replace(/\[/g,'(');
	input_str = input_str.replace(/]/g,')');
	input_str = input_str.replace(/{/g,'(');
	input_str = input_str.replace(/}/g,')');
	input_str = input_str.replace(/>=/g,']');
	input_str = input_str.replace(/<=/g,'[');
	input_str = input_str.replace(/==/g,'=');
	input_str = input_str.replace(/!=/g,'!');
	input_str = input_str.replace(/\+-/g,'-');
	input_str = input_str.replace(/--/g,'+');
	input_str = replaceDecimals(input_str);
	input_str = replaceNegatives(input_str);
	return makePost(input_str);
}

function solvePostfix(intstr,expstr){
	var resultStack = [];
	var idx = 0;
	for(var i = 0; i < expstr.length; i++) {
		if(expstr[i]=='#') {
			resultStack.push(intstr[idx]);
			idx++;
		} else {
			var a = resultStack.pop();
			var b = resultStack.pop();
			if(expstr[i] === "+") {
				resultStack.push(parseInt(a) + parseInt(b));
			} else if(expstr[i] === "-") {
				resultStack.push(parseInt(b) - parseInt(a));
			} else if(expstr[i] === "*") {
				resultStack.push(parseInt(a) * parseInt(b));
			} else if(expstr[i] === "/") {
				resultStack.push(parseInt(b) / parseInt(a));
			} else if(expstr[i] === "^") {
				resultStack.push(Math.pow(parseInt(b), parseInt(a)));
			} else if(expstr[i] === ">") {
				resultStack.push(parseInt(b) > parseInt(a));
			} else if(expstr[i] === "<") {
				resultStack.push(parseInt(b) < parseInt(a));
			} else if(expstr[i] === "]") {
				resultStack.push(parseInt(b) >= parseInt(a));
			} else if(expstr[i] === "[") {
				resultStack.push(parseInt(b) <= parseInt(a));
			} else if(expstr[i] === "=") {
				resultStack.push(parseInt(b) == parseInt(a));
			} else if(expstr[i] === "!") {
				resultStack.push(parseInt(b) != parseInt(a));
			} else if(expstr[i] === "&") {
				resultStack.push(b && a);
			} else if(expstr[i] === "|") {
				resultStack.push(b || a);
			}
		}
	}
	if(resultStack.length > 1) {
		return "error";
	} else {
		return resultStack.pop();
	}
}

function toData(array){
	var remidx = [];
	for (var i in array) {
		if (array[i].length == 1 && array[i][0] == ''){remidx.push(i); continue;}
		
		for (var ii=0;ii<array[i].length;ii++) {
			var cell = array[i][ii];
			if (!isNaN(parseFloat(cell))){
				if ((parseFloat(cell)%1)===0) {
					array[i][ii] = parseInt(cell);
				}
				else {
					array[i][ii] = parseFloat(cell);
				}
			}
		}
	}
	for (var i=0;i<remidx.length;i++){
		array.splice(remidx[remidx.length-1-i],1);
	}
}
exports.toData = function(array){
	toData(array);
	return array;
}

exports.newColumn = function(array,options) {
	toData(array);
	var formula = options.formula;
	if (!formula || formula == ''){return;}
	var vars = options.variables;
	var bothparts = postfixify(formula);
	
	var fullmap = {};
	for (var ii in vars){
		var rows = vars[ii].row.split(',');
		var rowStart; var rowEnd;
		if (rows[0].indexOf('$')==0 && rows[1].indexOf('$')==0){
			rowStart = parseInt(rows[0].substring(1));
			rowEnd = parseInt(rows[1].substring(1));
			console.log(rowEnd);
			if (rowEnd < 0){
				rowEnd = array.length + rowEnd;
			}
			console.log(rowEnd);
			if (rowEnd > array.length-1){
				rowEnd = array.length - 1;
			}
			console.log(rowEnd);
			if (rowStart < 0){
				rowStart = array.length + rowStart;
			}
			rowEnd = rowEnd - options.nHeaders;
			console.log(rowEnd);
			rowStart = rowStart - options.nHeaders;
		}
		else {
			continue;
		}
		console.log(rowStart,rowEnd);
		if (vars[ii].type=='mean'){
			var sum = 0;
			var n = 0;
			for (var i=rowStart;i<=rowEnd;i++){
				sum += parseInt(array[i][vars[ii].column]);
				n += 1;
			}
			if (n > 0){
				fullmap[ii.toUpperCase()]=sum/n;
			}
		}
		else if (vars[ii].type=='count'){
			var n = 0;
			for (var i=rowStart;i<=rowEnd;i++){
				n += 1;
			}
			fullmap[ii.toUpperCase()]=n;
		}
		else if (vars[ii].type=='sum'){
			var sum = 0;
			for (var i=rowStart;i<=rowEnd;i++){
				sum += parseInt(array[i][vars[ii].column]);
			}
			fullmap[ii.toUpperCase()]=sum;
		}
		else if (vars[ii].type=='max'){
			var max = parseInt(array[0][vars[ii].column]);
			for (var i=rowStart;i<=rowEnd;i++){
				if (parseInt(array[i][vars[ii].column]) > max){
					max = parseInt(array[i][vars[ii].column]);
				}
			}
			fullmap[ii.toUpperCase()]=max;
		}
		else if (vars[ii].type=='min'){
			var min = parseInt(array[0][vars[ii].column]);
			for (var i=rowStart;i<=rowEnd;i++){
				if (parseInt(array[i][vars[ii].column]) < min){
					min = parseInt(array[i][vars[ii].column]);
				}
			}
			fullmap[ii.toUpperCase()]=min;
		}
	}
		
	for (var i in array){
		var rowmap = {};
		var skipi = false;
		for (var ii in vars){
			if (vars[ii].type=='value'){
				var row = parseInt(i);
				if (vars[ii].row.indexOf('$')==0){
					row = parseInt(vars[ii].row.substring(1))-options.nHeaders;
				}
				else {
					row += parseInt(vars[ii].row);
				}
				if (row < 0 || row >= array.length){
					skip1 = true;
					break;
				}
				else {
					rowmap[ii.toUpperCase()]=parseInt(array[row][vars[ii].column]);
				}
			}
			else {
				var rows = vars[ii].row.split(',');
				var rowStart; var rowEnd;
				if (rows[0].indexOf('$')==0 && rows[1].indexOf('$')==0){
					continue;
				}
				else {
					/*
					rowStart = parseInt(rows[0].substring(1));
					rowEnd = parseInt(rows[1].substring(1));
					if (rowEnd < 0){
						rowEnd = array.length + rowEnd;
					}
					if (rowEnd > array.length-1){
						rowEnd = array.length - 1;
					}
					if (rowStart < 0){
						rowStart = array.length + rowStart;
					}
					rowEnd = rowEnd - options.nHeaders;
					rowStart = rowStart - options.nHeaders;
					*/
				}
			}
		}
		if (skipi){array[i].push(''); continue;}
		var intstr = [];
		for (var ii in bothparts[0]){
			if(fullmap[bothparts[0][ii]]){
				intstr.push(fullmap[bothparts[0][ii]]);
			}
			else if(rowmap[bothparts[0][ii]]){
				
				intstr.push(rowmap[bothparts[0][ii]]);
			}
			else {
				intstr.push(bothparts[0][ii]);
			}
		}
		var answer = solvePostfix(intstr,bothparts[1]);
		array[i].push(answer);

	}
} // Improve postfix, add median and stdev, get more values, data types, error handling, add if col>0

exports.sort = function(array,options) {
	toData(array);
	if (options.ascending){
		fsort(array).asc(u => u[options.column]);
	}
	else {
		fsort(array).desc(u => u[options.column]);
	}
} // Done?

exports.replace = function(array,options) {
	if (!options.find && options.find != 0){ return;}
	if (!options.replace && options.replace != 0){ return;}
	if (options.numerical){
	
	}
	else {
		var fstr;
		if (!options.case) { fstr = new RegExp(options.find,'gi');}
		else { fstr = new RegExp(options.find,'g');}
		
		for (var i in array){
			if (array[i][options.column]){
				array[i][options.column] = array[i][options.column].toString().replace(fstr,options.replace);
			}
			else if (options.column == -1) {
				for (var ii in array[i]){
					array[i][ii] = array[i][ii].toString().replace(fstr,options.replace);
				}
			}
		}
	}
} // add full cell option, numerical replace, input as regex

exports.pivot = function(array,options,hArray) {
	toData(array);
	var object = {};
	for (var i in array){
		if (array[i][options.pivot]){
			var k = array[i][options.pivot];
			if (!object[k]){
				object[k]=[];
				for (var ii in options.columns) {
					var col = parseInt(options.columns[ii].column);
					var type = options.columns[ii].type;
					if (type=='count'){
						object[k].push(1);
					}
					else if (type=='mean'){
						object[k].push({'sum':array[i][col],'n':1});
					}
					else{
						object[k].push(array[i][col]);
					}
				}
			}
			else {
				var iidx = 0;
				for (var ii in options.columns) {
					var col = parseInt(options.columns[ii].column);
					var type = options.columns[ii].type;
					if (type=='count'){
						object[k][iidx] += 1;
					}
					else if (type=='max'){
						if (array[i][col] > object[k][iidx]){
							object[k][iidx] = array[i][col];
						}
					}
					else if (type=='min'){
						if (array[i][col] < object[k][iidx]){
							object[k][iidx] = array[i][col];
						}
					}
					else if (type=='mean'){
						object[k][iidx].sum += array[i][col];
						object[k][iidx].n += 1;
					}
					else{
						object[k][iidx] += array[i][col];
					}
					iidx++;
				}
			}
			
		}
	}
	var idx = 0;
	for (var i in object){
		
		array[idx][0] = i;
		var iidx = 1;
		for (var ii in options.columns) {
			if (object[i][ii] || object[i][ii]==0) {
				if (options.columns[ii].type == 'mean'){
					if (object[i][ii].n>0){
						array[idx][iidx] = object[i][ii].sum/object[i][ii].n;
					}
					else {
						array[idx][iidx] = 0;
					}
				}
				else {
					array[idx][iidx] = object[i][ii];
				}
			}
			else {
				array[idx][iidx] = '';//Or maybe default to 0?
			}
			iidx++;
		}
		if (iidx<array[idx].length){array[idx].splice(iidx,array[idx].length-iidx);}
		idx++;
	}
	if (idx<array.length){array.splice(idx,array.length-idx);}
	
	var hArrayNew = [];
	for (var i in hArray){
		hArrayNew.push([]);
		if (hArray[i][options.pivot]){
			hArrayNew[i].push(hArray[i][options.pivot]);
		}
		for (var ii in options.columns) {
			hArrayNew[i].push(hArray[i][options.columns[ii].column]);
		}
	}
	idx = 0;
	for (var i in hArrayNew){
		var iidx = 0;
		for (var ii in hArrayNew[i]){
			hArray[idx][iidx]=hArrayNew[i][ii];
			iidx++;
		}
		
		if (iidx<hArray[idx].length){hArray[idx].splice(iidx,hArray[idx].length-iidx);}
		idx++;
	}
	if (idx<hArray.length){hArray.splice(idx,hArray.length-idx);}

} //Add countif? Add possibility to create buckets like weekly, etc. Error Handling

exports.ignore = function(array,options) {
	toData(array);
	var formula = options.formula;
	if (!formula || formula == ''){return;}
	var vars = options.variables;
	var bothparts = postfixify(formula);
	var skipRows = [];
	
	var fullmap = {};
	for (var ii in vars){
		if (vars[ii].type=='mean'){
			var sum = 0;
			var n = 0;
			for (var i in array){
				sum += parseInt(array[i][vars[ii].column]);
				n += 1;
			}
			if (n > 0){
				fullmap[ii.toUpperCase()]=sum/n;
			}
		}
		else if (vars[ii].type=='count'){
			var n = 0;
			for (var i in array){
				n += 1;
			}
			fullmap[ii.toUpperCase()]=n;
		}
		else if (vars[ii].type=='sum'){
			var sum = 0;
			for (var i in array){
				sum += parseInt(array[i][vars[ii].column]);
			}
			fullmap[ii.toUpperCase()]=sum;
		}
		else if (vars[ii].type=='max'){
			var max = parseInt(array[0][vars[ii].column]);
			for (var i in array){
				if (parseInt(array[i][vars[ii].column]) > max){
					max = parseInt(array[i][vars[ii].column]);
				}
			}
			fullmap[ii.toUpperCase()]=max;
		}
		else if (vars[ii].type=='min'){
			var min = parseInt(array[0][vars[ii].column]);
			for (var i in array){
				if (parseInt(array[i][vars[ii].column]) < min){
					min = parseInt(array[i][vars[ii].column]);
				}
			}
			fullmap[ii.toUpperCase()]=min;
		}
	}
		
	for (var i in array){
		var rowmap = {};
		for (var ii in vars){
			if (vars[ii].type=='value'){
				var row = parseInt(i);
				if (vars[ii].row.indexOf('$')==0){
					row = parseInt(vars[ii].row.substring(1));
				}
				else {
					row += parseInt(vars[ii].row);
				}
				rowmap[ii.toUpperCase()]=parseInt(array[row][vars[ii].column]);
			}
		}
		var intstr = [];
		for (var ii in bothparts[0]){
			if(fullmap[bothparts[0][ii]]){
				intstr.push(fullmap[bothparts[0][ii]]);
			}
			else if(rowmap[bothparts[0][ii]]){
				intstr.push(rowmap[bothparts[0][ii]]);
			}
			else {
				intstr.push(bothparts[0][ii]);
			}
		}
		var answer = solvePostfix(intstr,bothparts[1]);

		if (answer){
			skipRows.push(i);
		}

	}
	
	for (var i=skipRows.length-1;i>=0;i--){
		array.splice(skipRows[i],1);
	}
} //Add expression logic

