'use strict';

const chai = require('chai');
const sinon = require('sinon');
const SlaveWAMPServer = require('./SlaveWAMPServer');
const expect = chai.expect;

describe('SlaveWAMPServer', function () {

	describe('constructor', function () {
		let fakeWorker;

		beforeEach(function () {
			fakeWorker = {
				id: 0,
				on: sinon.spy(),
				scServer: {
					clients: {}
				}
			};
		});

		it('create SlaveWAMPServer with worker field', function () {
			const slaveWAMPServer = new SlaveWAMPServer(fakeWorker);
			expect(slaveWAMPServer).to.have.property('worker').to.be.a('object').and.to.have.property('id').equal(0);
		});

		it('create SlaveWAMPServer with RPCCalls field', function () {
			const slaveWAMPServer = new SlaveWAMPServer(fakeWorker);
			expect(slaveWAMPServer).to.have.property('interProcessRPC').to.be.a('object').and.to.be.empty;
		});

		it('create SlaveWAMPServer with sockets field', function () {
			const slaveWAMPServer = new SlaveWAMPServer(fakeWorker);
			expect(slaveWAMPServer).to.have.property('sockets').to.be.a('object').and.to.be.empty;
		});

		it('create SlaveWAMPServer with sockets field', function () {
			const slaveWAMPServer = new SlaveWAMPServer(fakeWorker);
			expect(slaveWAMPServer).to.have.property('sockets').to.be.a('object').and.to.be.empty;
		});

		it('create SlaveWAMPServer and register event listener from master process', function () {
			new SlaveWAMPServer(fakeWorker);
			expect(fakeWorker.on.calledOnce).to.be.ok;
			expect(fakeWorker.on.calledWith('masterMessage')).to.be.ok;
		});
	});

});
