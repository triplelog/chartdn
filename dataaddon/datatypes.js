'use strict';
const { PerformanceObserver, performance } = require('perf_hooks');

const assert = require('assert');
const bindingPath = require.resolve(`./build/Release/binding`);
const arrayPath = require.resolve(`./build/Release/bindingArray`);
const datatypes = require(bindingPath);
const dataArray = require(arrayPath);

function outputValue(t,v,w){
	if (t == 'I'){
		return v;
	}
	else if (t == 'S'){
		return v;
	}
	else if (t == 'F'){
		if (w> 0){
			return v*Math.pow(10,w);
		}
		else if (w< 0){
			return v/Math.pow(10,-1*w);
		}
	}
	return v;
}
/*
var allins = [];
console.log(performance.now());
for (var i=0;i<100000;i++){
	var newrow = []
	for (var ii=0;ii<10;ii++){
		//var out = datatypes.getType('a'+i);
		if (i%77777==0){
			newrow.push(''+i*10+ii);
		}
		else {
			newrow.push('a'+i*10+ii);
		}
	}
	allins.push(newrow);
}
console.log(performance.now());

var allouts = [];
var out = [];
for (var i=0;i<100000;i++){
	out.push(datatypes.loadarray(allins[i]));
}

console.log(performance.now());
console.log(out.slice(0,5));

out = [];
for (var i=0;i<100000;i++){
	out.push(datatypes.readarray(i));
}

console.log(performance.now());
console.log(out.slice(0,5));
*/
function getDataType(x) {
	var t = datatypes.hello(x)[0];
	return t;
}
exports.makeTypes = function(data){
	if (data.length<2){
		return [];
	}
	var datatypes = [];
	var ncols = Math.max(data[0].length,data[1].length);
	for (var i=0;i<ncols;i++){
		datatypes.push({});
	}

	var nHeaders = 1;
	var headers = [];
	for (var ii=0;ii<data[0].length;ii++) {
		var cell = data[0][ii];
		headers.push(cell);
	}
	var dataTypes = {};
	var headerLen = headers.length;
	for (var i=nHeaders;i<data.length-1;i++) {
		var len = Math.min(data[i].length,headerLen);
		for (var ii=0;ii<len;ii++) {
			var cell = data[i][ii];
			
			var type = getDataType(cell);
			//console.log(cell, type);
			if (datatypes[ii][type]){
				datatypes[ii][type]+=1;
			}
			else {
				datatypes[ii][type]=1;
			}	
		}
	}
	var typeArray = [];
	for (var i=0;i<ncols;i++){
		var maxValue = 0;
		var maxType = '';
		for (var ii in datatypes[i]){
			if (datatypes[i][ii]>maxValue){
				maxValue = datatypes[i][ii];
				maxType = ii;
			}
		}
		typeArray.push(maxType);
	}
	return typeArray;
}

exports.loadRows = function(data){
	if (data.length<2){
		return [];
	}
	var datatypes = [];
	var ncols = Math.max(data[0].length,data[1].length);
	for (var i=0;i<ncols;i++){
		datatypes.push({});
	}

	var nHeaders = 1;
	var headers = [];
	for (var ii=0;ii<data[0].length;ii++) {
		var cell = data[0][ii];
		headers.push(cell);
	}
	var headerLen = headers.length;
	for (var i=nHeaders;i<data.length-1;i++) {
		//var len = Math.min(data[i].length,headerLen);
		dataArray.loadarray(data[i]);
	}
}
exports.readRow = function(i){
	var outRaw = dataArray.readarray(i);
	var out = [];
	if (outRaw.length>0){
		for (var i=0;i<outRaw.length/3;i++){
			out.push(outputValue(outRaw[i*3],outRaw[i*3+1],outRaw[i*3+2]));
		}
	}
	return out;
}
exports.clearArray = function(i){
	dataArray.cleararray();
}
exports.copyArray = function(i){
	dataArray.copyarray();
}
exports.sortArray = function(options){
	var i = options.column;
	var j = true;
	if (!options.ascending){
		j = false;
	}
	dataArray.sortarray(i,j);
}
exports.readCol = function(i){
	var outRaw = dataArray.readarraycol(i);
	var out = [];
	for (var i=0;i<outRaw.length/3;i++){
		out.push(outputValue(outRaw[i*3],outRaw[i*3+1],outRaw[i*3+2]));
	}
	return out;
}



exports.newCol = function(options){
	var intstr = options.intstr;//["a","b","1"];
	var exp = options.expstr;//"##+#+";
	var vars = [];
	for (var i in options.vars){
		vars.push(options.vars[i].type);
		vars.push(i);
		vars.push(options.vars[i].column);
		var rows = options.vars[i].row.split(',');
		if (rows[0].indexOf('$')==0){vars.push(rows[0].substring(1));}
		else {vars.push(-2);}
		if (rows.length >= 2 && rows[1].indexOf('$')==0){vars.push(rows[1].substring(1));}
		else {vars.push(-2);}
		if (rows[0].indexOf('$')==-1){vars.push(rows[0]);}
		else {vars.push(-2);}
		if (rows.length >= 2 && rows[1].indexOf('$')==-1){vars.push(rows[1]);}
		else {vars.push(-2);}
	}
	//var vars = ["max","a",1,0,-1,-2,-2,"value","b",2,-2,-2,0,0];
	var out = dataArray.newcolumn(intstr,exp,vars);
	console.log(out);
	//types.push('Float');
}



/*var allins = [];
console.log(performance.now());
for (var i=0;i<1000000;i++){
	//var out = datatypes.getType('a'+i);
	if (i%77777==0){
		allins.push(''+i);
	}
	else {
		allins.push('a'+i);
	}
}
console.log(performance.now());

var allouts = [];
var out;
for (var i=0;i<1000000;i++){
	out = datatypes.hello(allins[i]);
	if (i%77777==0){
		console.log(i,out+1);
	}
	else if (i%77777==1) {
		console.log(i,out+1);
	}
}
console.log(out);
console.log(performance.now());


var alloutsjs = [];
for (var i=0;i<1000000;i++){
	var x = allins[i];
	alloutsjs[i] = x+x+x+x+x;
}
console.log(performance.now());
console.log(alloutsjs[0]);*/

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
	var dindex = istr.indexOf('.');
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
	input_str = input_str.replace(/\sAND\s/g,'&');
	input_str = input_str.replace(/\sOR\s/g,'|');
	input_str = input_str.replace(/\s/g,'');
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