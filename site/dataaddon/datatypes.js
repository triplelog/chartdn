'use strict';
const { PerformanceObserver, performance } = require('perf_hooks');

const assert = require('assert');
const bindingPath = require.resolve(`./build/Release/binding`);
const datatypes = require(bindingPath).getType;


var allins = [];
console.log(performance.now());
for (var i=0;i<100000;i++){
	//var out = datatypes.getType('a'+i);
	allins.push('a'+i);
}
console.log(performance.now());


var allouts = [];
for (var i=0;i<100000;i++){
	allouts[i] = datatypes(allins[i]);
}
console.log(performance.now());
console.log(allouts[0]);

var alloutsjs = [];
for (var i=0;i<100000;i++){
	alloutsjs[i] = allins[i]+allins[i];
}
console.log(performance.now());
console.log(alloutsjs[0]);

