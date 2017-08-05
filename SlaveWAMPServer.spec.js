/* eslint no-unused-expressions: 0 */
// https://github.com/jonathanglasmeyer/graphql-sequelize/commit/00814cac3aa9fa6d20aed38df838dcbc4b4ab9b4

const chai = require('chai');
const sinon = require('sinon');
const SlaveWAMPServer = require('./SlaveWAMPServer');

const expect = chai.expect;

describe('SlaveWAMPServer', () => {
	describe('constructor', () => {
		let fakeWorker;

		beforeEach(() => {
			fakeWorker = {
				id: 0,
				on: sinon.spy(),
				scServer: {
					clients: {},
				},
			};
		});

		it('create SlaveWAMPServer with worker field', () => {
			const slaveWAMPServer = new SlaveWAMPServer(fakeWorker);
			expect(slaveWAMPServer).to.have.property('worker').to.be.a('object').and.to.have.property('id').equal(0);
		});

		it('create SlaveWAMPServer with RPCCalls field', () => {
			const slaveWAMPServer = new SlaveWAMPServer(fakeWorker);
			expect(slaveWAMPServer).to.have.property('interProcessRPC').to.be.a('object').and.to.be.empty;
		});

		it('create SlaveWAMPServer with sockets field', () => {
			const slaveWAMPServer = new SlaveWAMPServer(fakeWorker);
			expect(slaveWAMPServer).to.have.property('sockets').to.be.a('object').and.to.be.empty;
		});

		it('create SlaveWAMPServer with sockets field', () => {
			const slaveWAMPServer = new SlaveWAMPServer(fakeWorker);
			expect(slaveWAMPServer).to.have.property('sockets').to.be.a('object').and.to.be.empty;
		});

		it('create SlaveWAMPServer and register event listener from master process', () => {
			/* eslint-disable no-new */
			new SlaveWAMPServer(fakeWorker);
			expect(fakeWorker.on.calledOnce).to.be.ok;
			expect(fakeWorker.on.calledWith('masterMessage')).to.be.ok;
		});
	});

	describe('normalizeRequest', () => {
		let validRequest;

		const fakeWorker = {
			id: 0,
			on: sinon.spy(),
			scServer: {
				clients: {},
			},
		};

		const normalizeRequest = new SlaveWAMPServer(fakeWorker).normalizeRequest;

		beforeEach(() => {
			validRequest = {
				socketId: 'validSocketId',
				procedure: 'validProcedure',
			};
		});

		it('should throw an exception when invoked with empty object', () => {
			expect(normalizeRequest.bind(null, {})).to.throw;
		});

		it('should throw an exception when invoked with undefined', () => {
			expect(normalizeRequest.bind(null, undefined)).to.throw;
		});

		it('should throw an exception when invoked with null', () => {
			expect(normalizeRequest.bind(null, null)).to.throw;
		});

		it('should throw an exception when invoked without socketId', () => {
			delete validRequest.socketId;
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested socket id: undefined');
		});

		it('should throw an exception when invoked without procedure', () => {
			delete validRequest.procedure;
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested procedure: undefined');
		});

		it('should throw an exception when invoked with socketId as number', () => {
			validRequest.socketId = 1;
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested socket id: 1');
		});

		it('should throw an exception when invoked with socketId as object', () => {
			validRequest.socketId = {};
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested socket id: [object Object]');
		});

		it('should throw an exception when invoked with procedure as number', () => {
			validRequest.procedure = 1;
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested procedure: 1');
		});

		it('should throw an exception when invoked with procedure as object', () => {
			validRequest.procedure = {};
			expect(normalizeRequest.bind(null, validRequest)).to.throw('Wrong format of requested procedure: [object Object]');
		});

		it('should return unchanged object for valid request', () => {
			expect(normalizeRequest(validRequest)).to.eql(validRequest);
		});

		it('should remove dot from socketId', () => {
			validRequest.socketId = 'a.b';
			expect(normalizeRequest(validRequest).socketId).to.equal('ab');
		});

		it('should remove dots from socketId', () => {
			validRequest.socketId = 'a.b.c.d.e';
			expect(normalizeRequest(validRequest).socketId).to.equal('abcde');
		});

		it('should remove dot from procedure', () => {
			validRequest.procedure = 'a.b';
			expect(normalizeRequest(validRequest).procedure).to.equal('ab');
		});

		it('should remove dots from procedure', () => {
			validRequest.procedure = 'a.b.c.d.e';
			expect(normalizeRequest(validRequest).procedure).to.equal('abcde');
		});
	});

	describe('processWAMPRequest', () => {
		const workerMock = {
			id: 'validWorkerId',
			on: sinon.spy(),
			sendToMaster: sinon.spy(),
			scServer: {
				clients: [],
			},
		};

		const socketMock = {
			id: 'validSocketId',
			on: sinon.spy(),
			send: sinon.spy(),
		};

		const slaveWampServer = new SlaveWAMPServer(workerMock);

		let validRequest;
		let	validSlaveToMasterRequest;

		beforeEach(() => {
			workerMock.on.reset();
			workerMock.sendToMaster.reset();

			socketMock.on.reset();
			socketMock.send.reset();

			validRequest = {
				procedure: 'procedureName',
				type: '/WAMPRequest',
			};

			validSlaveToMasterRequest = {
				procedure: 'procedureName',
				type: '/MasterWAMPRequest',
				socketId: 'validSocketId',
				workerId: 'validWorkerId',
			};
		});

		it('should pass request forward to master if procedure is not registered in SlaveWAMPServer', () => {
			slaveWampServer.processWAMPRequest(validRequest, socketMock);
			expect(workerMock.sendToMaster.calledOnce).to.be.ok;
			expect(workerMock.sendToMaster.calledWith(validSlaveToMasterRequest)).to.be.ok;
		});

		it('should invoke procedure on SlaveWAMPServer if registered before', () => {
			const endpoint = { procedureName: sinon.spy() };
			slaveWampServer.registerRPCSlaveEndpoints(endpoint);
			slaveWampServer.processWAMPRequest(validRequest, socketMock);
			expect(endpoint.procedureName.calledOnce).to.be.ok;
			expect(endpoint.procedureName.calledWith({
				procedure: 'procedureName',
				type: '/WAMPRequest',
				socketId: 'validSocketId',
				workerId: 'validWorkerId',
			})).to.be.ok;

			expect(workerMock.sendToMaster.called).not.to.be.ok;
		});

		it('should invoke procedure on SlaveWAMPServer if reassigned before', () => {
			const endpoint = { procedureName: sinon.spy() };
			slaveWampServer.reassignRPCSlaveEndpoints(endpoint);
			slaveWampServer.processWAMPRequest(validRequest, socketMock);
			expect(endpoint.procedureName.calledOnce).to.be.ok;
			expect(endpoint.procedureName.calledWith({
				procedure: 'procedureName',
				type: '/WAMPRequest',
				socketId: 'validSocketId',
				workerId: 'validWorkerId',
			})).to.be.ok;

			expect(workerMock.sendToMaster.called).not.to.be.ok;
		});

		it('should invoke procedure on SlaveWAMPServer if it was registered on both WAMPServer and SlaveWAMPServer', () => {
			const endpoint = { procedureName: sinon.spy() };
			slaveWampServer.registerRPCEndpoints(endpoint);
			slaveWampServer.registerRPCSlaveEndpoints(endpoint);
			slaveWampServer.processWAMPRequest(validRequest, socketMock);
			expect(endpoint.procedureName.calledOnce).to.be.ok;
			expect(endpoint.procedureName.calledWith({
				procedure: 'procedureName',
				type: '/WAMPRequest',
				socketId: 'validSocketId',
				workerId: 'validWorkerId',
			})).to.be.ok;

			expect(workerMock.sendToMaster.called).not.to.be.ok;
		});
	});
});
