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
	for (var i in array) {
		if (array[i].length == 1 && array[i][0] == ''){continue;}
		
		for (var ii=0;i<array[i].length;i++) {
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
}
exports.toData = function(array){
	toData(array);
}

exports.newColumn = function(array,options) {
	toData(array);
	var formula = options.formula;
	var vars = options.variables;
	var bothparts = postfixify(formula);
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
			if(rowmap[bothparts[0][ii]]){
				intstr.push(rowmap[bothparts[0][ii]]);
			}
			else {
				intstr.push(bothparts[0][ii]);
			}
		}
		var answer = solvePostfix(intstr,bothparts[1]);
		array[i].push(answer);

	}
} // Improve postfix, get more values, error handling

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
	if (options.numerical){
	
	}
	else {
		var fstr;
		if (!options.case) { fstr = new RegExp(options.find,'gi');}
		else { fstr = new RegExp(options.find,'g');}
		
		for (var i in array){
			array[i][options.column] = array[i][options.column].replace(fstr,options.replace);
		}
	}
}

exports.pivot = function(array,options) {
	if (options.ascending){
		fsort(array).asc(u => u[options.column]);
	}
	else {
		fsort(array).desc(u => u[options.column]);
	}
}

exports.ignore = function(array,options) {
	if (options.ascending){
		fsort(array).asc(u => u[options.column]);
	}
	else {
		fsort(array).desc(u => u[options.column]);
	}
}
exports.scale = function(array,options) {
	if (options.ascending){
		fsort(array).asc(u => u[options.column]);
	}
	else {
		fsort(array).desc(u => u[options.column]);
	}
}
