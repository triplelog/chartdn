'use strict';
const assert = require('assert');
const bindingPath = require.resolve(`./build/Release/binding`);
const binding = require(bindingPath);
assert.strictEqual(binding.hello(), 'world');
console.log('binding.hello() =', binding.hello());