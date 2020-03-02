'use strict';
const { PerformanceObserver, performance } = require('perf_hooks');

const assert = require('assert');
const bindingPath = require.resolve(`./build/Release/binding`);
const datatypes = require(bindingPath);

var allouts = [];
console.log(performance.now());
for (var i=0;i<1000;i++){
	var out = datatypes.getType('a'+i);
	allouts.push(out);
}
console.log(performance.now());