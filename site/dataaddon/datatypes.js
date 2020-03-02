'use strict';
const assert = require('assert');
const bindingPath = require.resolve(`./build/Release/binding`);
const binding = require(bindingPath);
console.log('hello', binding);