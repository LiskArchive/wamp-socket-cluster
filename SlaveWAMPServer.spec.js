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

	describe('normalizeRequest', function () {

		let validRequest;

		const fakeWorker = {
			id: 0,
			on: sinon.spy(),
			scServer: {
				clients: {}
			}
		};

		const normalizeRequest = new SlaveWAMPServer(fakeWorker).normalizeRequest;

		beforeEach(() => {
			validRequest = {
				socketId: 'validSocketId',
				procedure: 'validProcedure',
			};
		});

		it('should throw an exception when invoked with empty object', function () {
			expect(normalizeRequest.bind(null, {})).to.throw;
		});

		it('should throw an exception when invoked with undefined', function () {
			expect(normalizeRequest.bind(null, undefined)).to.throw;
		});

		it('should throw an exception when invoked with null', function () {
			expect(normalizeRequest.bind(null, null)).to.throw;
		});

		it('should throw an exception when invoked without socketId', function () {
			delete validRequest.socketId;
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested socket id: undefined');
		});

		it('should throw an exception when invoked without procedure', function () {
			delete validRequest.procedure;
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested procedure: undefined');
		});

		it('should throw an exception when invoked with socketId as number', function () {
			validRequest.socketId = 1;
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested socket id: 1');
		});

		it('should throw an exception when invoked with socketId as object', function () {
			validRequest.socketId = {};
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested socket id: [object Object]');
		});

		it('should throw an exception when invoked with procedure as number', function () {
			validRequest.procedure = 1;
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested procedure: 1');
		});

		it('should throw an exception when invoked with procedure as object', function () {
			validRequest.procedure = {};
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested procedure: [object Object]');
		});

		it('should return unchanged object for valid request', function () {
			expect(normalizeRequest(validRequest)).to.eql(validRequest);
		});

		it('should return remove dot from socketId', function () {
			validRequest.socketId = 'a.b';
			expect(normalizeRequest(validRequest).socketId).to.equal('ab');
		});

		it('should return remove dots from socketId', function () {
			validRequest.socketId = 'a.b.c.d.e';
			expect(normalizeRequest(validRequest).socketId).to.equal('abcde');
		});

		it('should return remove dot from procedure', function () {
			validRequest.procedure = 'a.b';
			expect(normalizeRequest(validRequest).procedure).to.equal('ab');
		});

		it('should return remove dots from procedure', function () {
			validRequest.procedure = 'a.b.c.d.e';
			expect(normalizeRequest(validRequest).procedure).to.equal('abcde');
		});

	});

	describe('processWAMPRequest', function () {

		const workerMock = {
			id: 'validWorkerId',
			on: sinon.spy(),
			sendToMaster: sinon.spy(),
			scServer: {
				clients: []
			}
		};

		const socketMock = {
			id: 'validSocketId',
			on: sinon.spy(),
			send: sinon.spy()
		};

		const slaveWampServer = new SlaveWAMPServer(workerMock);

		let validRequest, validSlaveToMasterRequest;

		beforeEach(function () {
			workerMock.on.reset();
			workerMock.sendToMaster.reset();

			socketMock.on.reset();
			socketMock.send.reset();

			validRequest = {
				'procedure': 'procedureName',
				'type': '/WAMPRequest',
			};

			validSlaveToMasterRequest = {
				'procedure': 'procedureName',
				'type': '/MasterWAMPRequest',
				'socketId': 'validSocketId',
				'workerId': 'validWorkerId'
			};
		});

		it('should pass request forward to master if procedure is not registered in SlaveWAMPServer', function () {
			slaveWampServer.processWAMPRequest(validRequest, socketMock);
			expect(workerMock.sendToMaster.calledOnce).to.be.ok;
			expect(workerMock.sendToMaster.calledWith(validSlaveToMasterRequest)).to.be.ok;
		});

		it('should invoke procedure on SlaveWAMPServer if registered before', function () {
			const endpoint = {procedureName: sinon.spy()};
			slaveWampServer.registerRPCSlaveEndpoints(endpoint);
			slaveWampServer.processWAMPRequest(validRequest, socketMock);
			expect(endpoint.procedureName.calledOnce).to.be.ok;
			expect(endpoint.procedureName.calledWith({
				'procedure': 'procedureName',
				'type': '/WAMPRequest',
				'socketId': 'validSocketId',
				'workerId': 'validWorkerId'
			})).to.be.ok;

			expect(workerMock.sendToMaster.called).not.to.be.ok;
		});

		it('should invoke procedure on SlaveWAMPServer if reassigned before', function () {
			const endpoint = {procedureName: sinon.spy()};
			slaveWampServer.reassignRPCSlaveEndpoints(endpoint);
			slaveWampServer.processWAMPRequest(validRequest, socketMock);
			expect(endpoint.procedureName.calledOnce).to.be.ok;
			expect(endpoint.procedureName.calledWith({
				'procedure': 'procedureName',
				'type': '/WAMPRequest',
				'socketId': 'validSocketId',
				'workerId': 'validWorkerId'
			})).to.be.ok;

			expect(workerMock.sendToMaster.called).not.to.be.ok;
		});
	});
});
