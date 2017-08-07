/* eslint-env node, mocha */

const chai = require('chai');
const dirtyChai = require('dirty-chai');

chai.use(dirtyChai);
module.exports = { expect: chai.expect };
