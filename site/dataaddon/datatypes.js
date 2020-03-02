'use strict';
const assert = require('assert');
const bindingPath = require.resolve(`./build/Release/binding`);
const datatypes = require(bindingPath);
console.log(datatypes.getType('a'));