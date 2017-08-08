/* eslint-env node, mocha */
/* eslint-disable no-new */
const sinon = require('sinon');
const SlaveWAMPServer = require('./SlaveWAMPServer');

const { expect } = require('./testSetup.spec');

let clock;

before(() => {
	clock = sinon.useFakeTimers(new Date(2020, 1, 1).getTime());
});

after(() => {
	clock.restore();
});

describe('SlaveWAMPServer', () => {
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
					[validSignature]: () => {},
				},
			},
		};
	});

	describe('constructor', () => {
		it('create SlaveWAMPServer with worker field', () => {
			expect(slaveWAMPServer).to.have.property('worker').to.be.a('object').and.to.have.property('id').equal(0);
		});

		it('create SlaveWAMPServer with RPCCalls field', () => {
			expect(slaveWAMPServer).to.have.property('interProcessRPC').to.be.a('object').and.to.be.empty();
		});

		it('create SlaveWAMPServer with sockets field', () => {
			expect(slaveWAMPServer).to.have.property('sockets').to.be.a('object').and.to.be.empty();
		});

		it('create SlaveWAMPServer with sockets field', () => {
			expect(slaveWAMPServer).to.have.property('sockets').to.be.a('object').and.to.be.empty();
		});

		it('create SlaveWAMPServer and register event listener from master process', () => {
			expect(workerMock.on.calledOnce).to.be.true();
			expect(workerMock.on.calledWith('masterMessage')).to.be.ok();
		});
	});

	describe('normalizeRequest', () => {
		const normalizeRequest = SlaveWAMPServer.normalizeRequest;

		it('should throw an exception when invoked with empty object', () => {
			expect(normalizeRequest.bind(null, {})).to.throw();
		});

		it('should throw an exception when invoked with undefined', () => {
			expect(normalizeRequest.bind(null, undefined)).to.throw();
		});

		it('should throw an exception when invoked with null', () => {
			expect(normalizeRequest.bind(null, null)).to.throw();
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
		let socketMock;
		let validWAMPRequest;
		let validSlaveToMasterRequest;

		beforeEach(() => {
			socketMock = {
				id: 'validSocketId',
				on: sinon.spy(),
				send: sinon.spy(),
			};

			validWAMPRequest = {
				procedure: 'procedureName',
				type: '/WAMPRequest',
			};

			validSlaveToMasterRequest = {
				procedure: 'procedureName',
				type: '/MasterWAMPRequest',
				socketId: 'validSocketId',
				workerId: 0,
			};
		});

		it('should pass request forward to master if procedure is not registered in SlaveWAMPServer', () => {
			slaveWAMPServer.processWAMPRequest(validWAMPRequest, socketMock);
			expect(workerMock.sendToMaster.calledOnce).to.be.true();
			expect(workerMock.sendToMaster.calledWith(validSlaveToMasterRequest)).to.be.ok();
		});

		it('should invoke procedure on SlaveWAMPServer if registered before', () => {
			const endpoint = { procedureName: sinon.spy() };
			slaveWAMPServer.registerRPCSlaveEndpoints(endpoint);
			slaveWAMPServer.processWAMPRequest(validWAMPRequest, socketMock);
			expect(endpoint.procedureName.calledOnce).to.be.true();
			expect(endpoint.procedureName.calledWith({
				procedure: 'procedureName',
				type: '/WAMPRequest',
				socketId: 'validSocketId',
				workerId: 0,
			})).to.be.ok();

			expect(workerMock.sendToMaster.called).not.to.be.ok();
		});

		it('should invoke procedure on SlaveWAMPServer if reassigned before', () => {
			const endpoint = { procedureName: sinon.spy() };
			slaveWAMPServer.reassignRPCSlaveEndpoints(endpoint);
			slaveWAMPServer.processWAMPRequest(validWAMPRequest, socketMock);
			expect(endpoint.procedureName.calledOnce).to.be.true();
			expect(endpoint.procedureName.calledWith({
				procedure: 'procedureName',
				type: '/WAMPRequest',
				socketId: 'validSocketId',
				workerId: 0,
			})).to.be.ok();

			expect(workerMock.sendToMaster.called).not.to.be.ok();
		});

		it('should invoke procedure on SlaveWAMPServer if it was registered on both WAMPServer and SlaveWAMPServer', () => {
			const endpoint = { procedureName: sinon.spy() };
			slaveWAMPServer.registerRPCEndpoints(endpoint);
			slaveWAMPServer.registerRPCSlaveEndpoints(endpoint);
			slaveWAMPServer.processWAMPRequest(validWAMPRequest, socketMock);
			expect(endpoint.procedureName.calledOnce).to.be.true();
			expect(endpoint.procedureName.calledWith({
				procedure: 'procedureName',
				type: '/WAMPRequest',
				socketId: 'validSocketId',
				workerId: 0,
			})).to.be.ok();

			expect(workerMock.sendToMaster.called).not.to.be.ok();
		});
	});

	describe('sendToMaster', () => {
		before(() => {
			sinon.stub(Math, 'random').returns(0);
		});

		after(() => {
			Math.random.restore();
		});

		it('should pass correct InterProcessRPCRequestSchema compatible request to sendToMaster function', () => {
			slaveWAMPServer.sendToMaster(validProcedure, validData, validSocketId, validCb);
			expect(workerMock.sendToMaster.calledOnce).to.be.true();
			expect(workerMock.sendToMaster.calledWith({
				type: '/InterProcessRPCRequestSchema',
				procedure: validProcedure,
				data: validData,
				socketId: validSocketId,
				workerId: 0,
				signature: validSignature,
			})).to.be.ok();
		});

		it('should pass create a new entry in interProcessRPC map', () => {
			slaveWAMPServer.sendToMaster(validProcedure, validData, validSocketId, validCb);
			expect(slaveWAMPServer.interProcessRPC).to.have.nested.property(`${validSocketId}.${validProcedure}.${validSignature}`).to.be.a('function');
		});
	});

	describe('onSocketDisconnect', () => {
		it('should leave interProcessRPC in initial state when invoked without arguments', () => {
			slaveWAMPServer.onSocketDisconnect();
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should leave interProcessRPC in initial state when entry does not exist', () => {
			slaveWAMPServer.onSocketDisconnect(validSocketId);
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should remove existing entry from interProcessRPC', () => {
			slaveWAMPServer.interProcessRPC = validInterProcessRPCEntry;
			slaveWAMPServer.onSocketDisconnect(validSocketId);
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});
	});

	describe('saveCall', () => {
		it('should throw an error when invoked without arguments', () => {
			expect(slaveWAMPServer.saveCall).to.throw('Cannot save a call for wrong InterProcessRPCRequest request');
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should throw an error when invoked without socket id', () => {
			delete validRequest.socketId;
			expect(() => {
				slaveWAMPServer.saveCall(validRequest, validCb);
			}).to.throw('Cannot save a call for wrong InterProcessRPCRequest request');
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should throw an error when invoked without procedure', () => {
			delete validRequest.procedure;
			expect(() => {
				slaveWAMPServer.saveCall(validRequest, validCb);
			}).to.throw('Cannot save a call for wrong InterProcessRPCRequest request');
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should throw an error when invoked without signature', () => {
			delete validRequest.signature;
			expect(() => {
				slaveWAMPServer.saveCall(validRequest, validCb);
			}).to.throw('Cannot save a call for wrong InterProcessRPCRequest request');
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should throw an error when invoked without callback', () => {
			expect(() => {
				slaveWAMPServer.saveCall(validRequest);
			}).to.throw('Cannot save a call without callback');
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should create a new entry in interProcessRPC for valid request', () => {
			slaveWAMPServer.saveCall(validRequest, validCb);
			expect(slaveWAMPServer.interProcessRPC).to.have.nested.property(`${validSocketId}.${validProcedure}.${validSignature}`).to.be.a('function');
		});

		it('should create multiple entries in interProcessRPC for multiple valid requests', () => {
			slaveWAMPServer.saveCall(validRequest, validCb);
			const validRequestB = validRequest;
			validRequestB.socketId += 'B';
			validRequestB.procedure += 'B';
			validRequestB.signature += 'B';
			slaveWAMPServer.saveCall(validRequestB, validCb);
			expect(slaveWAMPServer.interProcessRPC)
				.to.have.nested.property(`${validSocketId}.${validProcedure}.${validSignature}`)
				.to.be.a('function');
			expect(slaveWAMPServer.interProcessRPC)
				.to.have.nested.property(`${validRequestB.socketId}.${validRequestB.procedure}.${validRequestB.signature}`)
				.to.be.a('function');
		});
	});

	describe('deleteCall', () => {
		it('should throw an error when invoked without arguments', () => {
			expect(slaveWAMPServer.deleteCall).to.throw('Cannot delete a call for wrong InterProcessRPCRequest request');
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should throw an error when invoked without socket id', () => {
			delete validRequest.socketId;
			expect(() => {
				slaveWAMPServer.deleteCall(validRequest);
			}).to.throw('Cannot delete a call for wrong InterProcessRPCRequest request');
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should throw an error when invoked without procedure', () => {
			delete validRequest.procedure;
			expect(() => {
				slaveWAMPServer.deleteCall(validRequest);
			}).to.throw('Cannot delete a call for wrong InterProcessRPCRequest request');
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should throw an error when invoked without signature', () => {
			delete validRequest.signature;
			expect(() => {
				slaveWAMPServer.deleteCall(validRequest);
			}).to.throw('Cannot delete a call for wrong InterProcessRPCRequest request');
			expect(slaveWAMPServer.interProcessRPC).to.be.empty();
		});

		it('should throw an error when entry does not exist', () => {
			expect(() => {
				slaveWAMPServer.deleteCall(validRequest);
			}).to.throw(`There is no internal requests registered for socket: ${validSocketId}, procedure: ${validProcedure} with signature ${validSignature}`);
		});

		describe('when call exists', () => {
			beforeEach(() => {
				slaveWAMPServer.interProcessRPC = validInterProcessRPCEntry;
			});

			it('should delete existing signature call for procedure in interProcessRPC', () => {
				slaveWAMPServer.deleteCall(validRequest);
				expect(slaveWAMPServer.interProcessRPC[validSocketId][validProcedure]).to.be.empty();
			});
		});
	});

	describe('getCall', () => {
		it('should return false when invoked without arguments', () => {
			expect(slaveWAMPServer.getCall()).to.be.not.ok();
		});

		it('should return false when a call does not exist', () => {
			expect(slaveWAMPServer.getCall(validRequest)).to.be.not.ok();
		});

		describe('when call exists', () => {
			beforeEach(() => {
				slaveWAMPServer.interProcessRPC = validInterProcessRPCEntry;
			});

			it('should return false when invoked without socket id', () => {
				delete validRequest.socketId;
				expect(slaveWAMPServer.getCall()).to.be.not.ok();
			});

			it('should return false when invoked without procedure', () => {
				delete validRequest.procedure;
				expect(slaveWAMPServer.getCall()).to.be.not.ok();
			});

			it('should return false when invoked without signature', () => {
				delete validRequest.signature;
				expect(slaveWAMPServer.getCall()).to.be.not.ok();
			});

			it('should return true when invoked with valid request', () => {
				expect(slaveWAMPServer.getCall(validRequest)).to.be.ok();
			});
		});
	});
});
