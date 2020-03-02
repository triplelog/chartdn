'use strict';
const { PerformanceObserver, performance } = require('perf_hooks');

const assert = require('assert');
const bindingPath = require.resolve(`./build/Release/binding`);
const datatypes = require(bindingPath);


var allins = [];
console.log(performance.now());
for (var i=0;i<1000;i++){
	//var out = datatypes.getType('a'+i);
	allins.push('a'+i);
}
console.log(performance.now());


var allouts = [];
for (var i=0;i<1000;i++){
	//var out = datatypes.getType('a'+i);
	allouts.push(allins[i]);
}
console.log(performance.now());

var allouts = [];
for (var i=0;i<1000;i++){
	//var out = datatypes.getType('a'+i);
	allouts[i] = allins[999-i];
}
console.log(performance.now());