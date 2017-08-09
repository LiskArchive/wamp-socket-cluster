/* eslint-env node, mocha */
/* eslint-disable no-new */
const sinon = require('sinon');
const { expect } = require('./testSetup.spec');
const MasterWAMPServer = require('./MasterWAMPServer');
const MasterWAMPRequestSchema = require('./schemas').MasterWAMPRequestSchema;
const WAMPResponseSchema = require('./schemas').WAMPResponseSchema;

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
				type: MasterWAMPRequestSchema.id,
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

				it('should call processWAMPRequest when proper MasterWAMPRequestSchema with received request', () => {
					onWorkerMessageHandler(validWorkerId, validMasterWAMPRequest);
					expect(masterWAMPServer.processWAMPRequest.calledWith(validMasterWAMPRequest))
						.to.be.true();
				});

				it('should not call processWAMPRequest when invalid MasterWAMPRequestSchema passed', () => {
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
					masterWAMPServer.reply = sinon.stub(masterWAMPServer, 'reply');
				});

				after(() => {
					masterWAMPServer.reply.restore();
				});

				it('should call reply function with null as socket with validWorker', () => {
					onWorkerStartHandler(validWorker);
					expect(masterWAMPServer.reply.calledWith(null)).to.be.true();
				});

				it('should call reply function with valid MasterConfigRequestSchema', () => {
					onWorkerStartHandler(validWorker);
					expect(masterWAMPServer.reply.args[0][1]).to.eql({
						registeredEvents: [],
						config: {},
						type: '/MasterConfigRequestSchema',
						workerId: validWorkerId,
					});
				});
			});

			describe('workerExit', () => {
				let onWorkerExitHandler;
				let validWorker;
				let masterWAMPServerReplyStub;

				beforeEach(() => {
					onWorkerExitHandler = fakeSCServer.on.getCalls()[2].args[1];
					validWorker = { id: validWorkerId };
					masterWAMPServerReplyStub = sinon.stub(masterWAMPServer, 'reply');
				});

				after(() => {
					masterWAMPServerReplyStub.restore();
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

	describe('reply', () => {
		let validRequest;
		let validData;

		beforeEach(() => {
			validRequest = {
				workerId: validWorkerId,
				type: MasterWAMPRequestSchema.id,
			};
			validData = { validKey: 'validValue' };
		});

		it('should invoke socketCluster.sendToWorker with a valid success WAMPResponse', () => {
			masterWAMPServer.reply(null, validRequest, null, validData);
			expect(masterWAMPServer.socketCluster.sendToWorker.calledWith(validWorkerId)).to.be.true();
			expect(masterWAMPServer.socketCluster.sendToWorker.args[0][1]).to.eql({
				workerId: 0,
				success: true,
				data: validData,
				type: WAMPResponseSchema.id,
				error: null,
			});
		});

		it('should invoke socketCluster.sendToWorker with a valid error WAMPResponse', () => {
			const errorMessage = 'Custom error';
			masterWAMPServer.reply(null, validRequest, errorMessage, validData);
			expect(masterWAMPServer.socketCluster.sendToWorker.calledWith(validWorkerId)).to.be.true();
			expect(masterWAMPServer.socketCluster.sendToWorker.args[0][1]).eql({
				workerId: 0,
				success: false,
				data: validData,
				type: WAMPResponseSchema.id,
				error: errorMessage,
			});
		});
	});
});
