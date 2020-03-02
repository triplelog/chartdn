'use strict';
const assert = require('assert');
const bindingPath = require.resolve(`./build/datatypes`);
const datatypes = require(bindingPath);
assert.strictEqual(datatypes.hello(), 'world');
console.log('datatypes.hello() =', binding.hello());