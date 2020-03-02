'use strict';
const { PerformanceObserver, performance } = require('perf_hooks');

const assert = require('assert');
const bindingPath = require.resolve(`./build/Release/binding`);
const datatypes = require(bindingPath);


var allins = [];
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
console.log(alloutsjs[0]);

