'use strict';

const chai = require('chai');
const sinon = require('sinon');
const ConcurrentWAMPServer = require('./SlaveWAMPServer');
const expect = chai.expect;

describe('MasterWAMPServer', function () {

	describe('constructor', function () {
		let fakeWorker;

		beforeEach(function () {
			fakeWorker = {
				id: 0,
				on: sinon.spy(),
				scServer: {
					clients: []
				}
			};
		});

		it('create concurrentWAMPServer with worker field', function () {
			const concurrentWAMPServer = new ConcurrentWAMPServer(fakeWorker);
			expect(concurrentWAMPServer).to.have.property('worker').to.be.a('object').and.to.have.property('id').equal(0);
		});

		it('create concurrentWAMPServer with RPCCalls field', function () {
			const concurrentWAMPServer = new ConcurrentWAMPServer(fakeWorker);
			expect(concurrentWAMPServer).to.have.property('RPCCalls').to.be.a('object').and.to.be.empty;
		});

		it('create concurrentWAMPServer and register event listener from master process', function () {
			new ConcurrentWAMPServer(fakeWorker);
			expect(fakeWorker.on.calledOnce).to.be.ok;
			expect(fakeWorker.on.calledWith('masterMessage')).to.be.ok;
		});
	});

});
