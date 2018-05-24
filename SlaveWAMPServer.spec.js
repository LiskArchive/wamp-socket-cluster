/* eslint-env node, mocha */
/* eslint-disable no-new */
const sinon = require('sinon');
const SlaveWAMPServer = require('./SlaveWAMPServer');

const { expect } = require('./testSetup.spec');

describe('SlaveWAMPServer', () => {
	let clock;
	let workerMock;
	let slaveWAMPServer;
	let validData;
	let validRequest;
	let validSignature;
	let validInterProcessRPCEntry;
	const validProcedure = 'validProcedure';
	const validSocketId = 'validSocketId';
	const validCb = sinon.spy();

	beforeEach(() => {
		clock = sinon.useFakeTimers(new Date(2020, 1, 1).getTime());
	});

	afterEach(() => {
		clock.restore();
	});

	beforeEach(() => {
		workerMock = {
			id: 0,
			on: sinon.spy(),
			sendToMaster: sinon.spy(),
			scServer: {
				clients: {},
			},
		};
		validCb.reset();
		slaveWAMPServer = new SlaveWAMPServer(workerMock);
		validSignature = `${new Date().getTime()}_0`;
		validRequest = {
			socketId: validSocketId,
			procedure: validProcedure,
			signature: validSignature,
		};
		validData = { validKey: 'validValue' };
		validInterProcessRPCEntry = {
			[validSocketId]: {
				[validProcedure]: {
					[validSignature]: {
						requestTimeout: setTimeout(() => {}, 0),
						callback: () => {},
					},
				},
			},
		};
	});


	describe('constructor', () => {
		it('create SlaveWAMPServer with worker field', () => {
			expect(slaveWAMPServer).to.have.property('worker').to.be.a('object').and.to.have.property('id').equal(0);
		});

		it('create SlaveWAMPServer with sockets field', () => {
			expect(slaveWAMPServer).to.have.property('sockets').to.be.a('object').and.to.be.empty();
		});

		it('create SlaveWAMPServer with sockets field', () => {
			expect(slaveWAMPServer).to.have.property('sockets').to.be.a('object').and.to.be.empty();
		});

		it('create SlaveWAMPServer and register event listener from master process', () => {
			expect(workerMock.on.calledOnce).to.be.true();
			expect(workerMock.on.calledWith('masterMessage')).to.be.true();
		});
	});

	describe('processWAMPRequest', () => {
		let socketMock;
		let respondMock;
		let validWAMPRequest;
		let validSlaveToMasterRequest;

		beforeEach(() => {
			socketMock = {
				id: 'validSocketId',
				on: sinon.spy(),
				send: sinon.spy(),
			};

			respondMock = function () {};

			validWAMPRequest = {
				procedure: 'procedureName',
				type: '/RPCRequest',
			};

			validSlaveToMasterRequest = {
				procedure: 'procedureName',
				type: '/MasterRPCRequest',
			};
		});

		it('should pass request forward to master if procedure is not registered in SlaveWAMPServer', () => {
			slaveWAMPServer.processWAMPRequest(validWAMPRequest, respondMock);
			expect(workerMock.sendToMaster.calledOnce).to.be.true();
			expect(workerMock.sendToMaster.calledWith(validSlaveToMasterRequest, respondMock)).to.be.true();
		});

		it('should invoke procedure on SlaveWAMPServer if registered before', () => {
			const endpoint = { procedureName: sinon.spy() };
			slaveWAMPServer.registerRPCSlaveEndpoints(endpoint);
			slaveWAMPServer.processWAMPRequest(validWAMPRequest, respondMock);
			expect(endpoint.procedureName.calledOnce).to.be.true();
			expect(endpoint.procedureName.calledWith({
				procedure: 'procedureName',
				type: '/RPCRequest',
			})).to.be.true();

			expect(workerMock.sendToMaster.called).not.to.be.true();
		});

		it('should invoke procedure on SlaveWAMPServer if reassigned before', () => {
			const endpoint = { procedureName: sinon.spy() };
			slaveWAMPServer.reassignRPCSlaveEndpoints(endpoint);
			slaveWAMPServer.processWAMPRequest(validWAMPRequest, respondMock);
			expect(endpoint.procedureName.calledOnce).to.be.true();
			expect(endpoint.procedureName.calledWith({
				procedure: 'procedureName',
				type: '/RPCRequest',
			})).to.be.true();

			expect(workerMock.sendToMaster.called).not.to.be.true();
		});

		it('should invoke procedure on SlaveWAMPServer if it was registered on both WAMPServer and SlaveWAMPServer', () => {
			const endpoint = { procedureName: sinon.spy() };
			slaveWAMPServer.registerRPCEndpoints(endpoint);
			slaveWAMPServer.registerRPCSlaveEndpoints(endpoint);
			slaveWAMPServer.processWAMPRequest(validWAMPRequest, respondMock);
			expect(endpoint.procedureName.calledOnce).to.be.true();
			expect(endpoint.procedureName.calledWith({
				procedure: 'procedureName',
				type: '/RPCRequest',
			})).to.be.true();

			expect(workerMock.sendToMaster.called).not.to.be.true();
		});
	});

	describe('sendToMaster', () => {
		let mathRandomStub;

		before(() => {
			mathRandomStub = sinon.stub(Math, 'random').returns(0);
		});

		after(() => {
			mathRandomStub.restore();
		});

		it('should pass correct InterProcessRPCRequestSchema compatible request to sendToMaster function', () => {
			slaveWAMPServer.sendToMaster(validProcedure, validData, validCb);
			expect(workerMock.sendToMaster.calledOnce).to.be.true();
			expect(workerMock.sendToMaster.calledWith({
				type: '/InterProcessRPCRequestSchema',
				procedure: validProcedure,
				data: validData,
			})).to.be.true();
		});

		describe('when internalRequestsTimeoutMs is exceeded', () => {
			beforeEach((done) => {
				clock.restore();
				slaveWAMPServer.internalRequestsTimeoutMs = 1;
				slaveWAMPServer.sendToMaster(validProcedure, validData, validCb);
				setTimeout(() => {
					validCb('RPC response timeout exceeded');
					done();
				}, slaveWAMPServer.internalRequestsTimeoutMs + 1);
			});

			it('should resolve request', () => {
				expect(validCb.calledOnce).to.be.true();
			});

			it('should resolve request with error = "RPC response timeout exceeded"', () => {
				expect(validCb.calledWithExactly('RPC response timeout exceeded')).to.be.true();
			});
		});
	});
});
