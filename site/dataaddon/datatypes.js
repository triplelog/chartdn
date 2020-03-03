'use strict';
const { PerformanceObserver, performance } = require('perf_hooks');

const assert = require('assert');
const bindingPath = require.resolve(`./build/Release/binding`);
const datatypes = require(bindingPath);


function getDataType(x) {
	var t = datatypes.hello(x).t;
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

