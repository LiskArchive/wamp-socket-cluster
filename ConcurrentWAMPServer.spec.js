'use strict';

const chai = require('chai');
const sinon = require('sinon');
const ConcurrentWAMPServer = require('./ConcurrentWAMPServer.js');
const expect = chai.expect;

describe('ConcurrentWAMPServer', function () {

	describe('constructor', function () {

		it('create concurrentWAMPServer with worker field', function () {
			const concurrentWAMPServer = new ConcurrentWAMPServer({id: 0, on: () => {}});
			expect(concurrentWAMPServer).to.have.property('worker').to.be.a('object').and.to.have.property('id').equal(0);
		});

		it('create concurrentWAMPServer with RPCCalls field', function () {
			const concurrentWAMPServer = new ConcurrentWAMPServer({id: 0, on: () => {}});
			expect(concurrentWAMPServer).to.have.property('RPCCalls').to.be.a('object').and.to.be.empty;
		});

		it('create concurrentWAMPServer and register event listener from master process', function () {
			const worker = {on: sinon.spy()};
			new ConcurrentWAMPServer(worker);
			expect(worker.on.calledOnce).to.be.ok;
			expect(worker.on.calledWith('masterMessage')).to.be.ok;
		});
	});

});
