'use strict';
const common = require('../../common');
const assert = require('assert');
const bindingPath = require.resolve(`./build/${common.buildType}/datatypes`);
const datatypes = require(bindingPath);
assert.strictEqual(datatypes.hello(), 'world');
console.log('datatypes.hello() =', binding.hello());