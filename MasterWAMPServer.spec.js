/* eslint-env node, mocha */
/* eslint-disable no-new */
const sinon = require('sinon');
const { expect } = require('./testSetup.spec');
const MasterWAMPServer = require('./MasterWAMPServer');
const MasterRPCRequestSchema = require('./schemas').MasterRPCRequestSchema;
const RPCResponseSchema = require('./schemas').RPCResponseSchema;

describe('MasterWAMPServer', () => {
	let fakeSCServer;
	let masterWAMPServer;
	const validWorkerId = 0;

	beforeEach(() => {
		fakeSCServer = {
			on: sinon.spy(),
			sendToWorker: sinon.spy(),
		};
		masterWAMPServer = new MasterWAMPServer(fakeSCServer);
	});

	describe('constructor', () => {
		it('create SlaveWAMPServer with socketCluster field', () => {
			expect(masterWAMPServer).to.have.property('socketCluster').to.be.a('object');
		});


		it('should start listening on "workerStart"', () => {
			new MasterWAMPServer(fakeSCServer);
			expect(fakeSCServer.on.called).to.be.true();
			expect(fakeSCServer.on.calledWith('workerStart')).to.be.true();
			expect(fakeSCServer.on.getCalls()[0].args[1]).to.be.a('function');
		});

		it('should start listening on "workerMessage"', () => {
			new MasterWAMPServer(fakeSCServer);
			expect(fakeSCServer.on.called).to.be.true();
			expect(fakeSCServer.on.calledWith('workerMessage')).to.be.true();
			expect(fakeSCServer.on.getCalls()[1].args[1]).to.be.a('function');
		});

		describe('socketCluster.on', () => {
			const validMasterWAMPRequest = {
				workerId: 0,
				socketId: 'AYX',
				type: MasterRPCRequestSchema.id,
				procedure: 'methodA',
				signature: '0',
				data: {},
			};

			const validInterProcessRPCRequest = {
				type: '/InterProcessRPCRequestSchema',
				procedure: 'updatePeer',
				data: {},
				socketId: '127.0.0.1:8000',
				workerId: 0,
				signature: '0',
			};


			beforeEach(() => {
				masterWAMPServer.processWAMPRequest = sinon.spy();
			});

			describe('workerMessage', () => {
				let onWorkerMessageHandler;

				beforeEach(() => {
					onWorkerMessageHandler = fakeSCServer.on.getCalls()[1].args[1];
				});

				it('should call processWAMPRequest when proper InterProcessRPCRequestSchema param passed to "workerMessage" handler', () => {
					onWorkerMessageHandler(validWorkerId, validInterProcessRPCRequest);
					expect(masterWAMPServer.processWAMPRequest.called).to.be.true();
				});

				it('should call processWAMPRequest when proper MasterWAMPRequest param passed to "workerMessage" handler', () => {
					onWorkerMessageHandler(validWorkerId, validMasterWAMPRequest);
					expect(masterWAMPServer.processWAMPRequest.called).to.be.true();
				});

				it('should call processWAMPRequest when proper MasterRPCRequestSchema with received request', () => {
					onWorkerMessageHandler(validWorkerId, validMasterWAMPRequest);
					expect(masterWAMPServer.processWAMPRequest.calledWith(validMasterWAMPRequest))
						.to.be.true();
				});

				it('should not call processWAMPRequest when invalid MasterRPCRequestSchema passed', () => {
					const invalidMasterWAMPCall = Object.assign({}, validMasterWAMPRequest, { type: 'invalid' });
					onWorkerMessageHandler(validWorkerId, invalidMasterWAMPCall);
					expect(masterWAMPServer.processWAMPRequest.called).not.to.be.true();
				});

				it('should not call processWAMPRequest when empty request passed', () => {
					onWorkerMessageHandler(validWorkerId, null);
					expect(masterWAMPServer.processWAMPRequest.called).not.to.be.true();
				});
			});

			describe('workerStart', () => {
				let onWorkerStartHandler;
				let validWorker;

				beforeEach(() => {
					onWorkerStartHandler = fakeSCServer.on.getCalls()[0].args[1];
					validWorker = { id: validWorkerId };
				});

				it('should call sendToWorker function with array of worker.id', () => {
					onWorkerStartHandler(validWorker);
					expect(masterWAMPServer.socketCluster.sendToWorker.calledWith(validWorker.id)).to.be.true();
				});

				it('should call reply function with valid MasterConfigRequestSchema', () => {
					onWorkerStartHandler(validWorker);
					expect(masterWAMPServer.socketCluster.sendToWorker.args[0][1]).to.eql({
						type: '/MasterConfigRequestSchema',
						registeredEvents: [],
						config: {},
					});
				});
			});

			describe('workerExit', () => {
				let onWorkerExitHandler;
				let validWorker;

				beforeEach(() => {
					onWorkerExitHandler = fakeSCServer.on.getCalls()[2].args[1];
					validWorker = { id: validWorkerId };
				});

				it('should not modify empty workerIndices array', () => {
					onWorkerExitHandler(validWorker);
					expect(masterWAMPServer.workerIndices).to.be.empty();
				});

				it('should remove the worker index from the workerIndices array if added previously', () => {
					masterWAMPServer.workerIndices = [0];
					onWorkerExitHandler(validWorker);
					expect(masterWAMPServer.workerIndices).to.be.empty();
				});

				it('should remove the worker index from the beginning of the workerIndices array if added previously', () => {
					masterWAMPServer.workerIndices = [0, 1, 2];
					onWorkerExitHandler(validWorker);
					expect(masterWAMPServer.workerIndices).to.eql([1, 2]);
				});

				it('should remove the worker index from the middle of the workerIndices array if added previously', () => {
					masterWAMPServer.workerIndices = [1, 0, 2];
					onWorkerExitHandler(validWorker);
					expect(masterWAMPServer.workerIndices).to.eql([1, 2]);
				});

				it('should remove the worker index from the end of the workerIndices array if added previously', () => {
					masterWAMPServer.workerIndices = [1, 2, 0];
					onWorkerExitHandler(validWorker);
					expect(masterWAMPServer.workerIndices).to.eql([1, 2]);
				});
			});
		});
	});

});
