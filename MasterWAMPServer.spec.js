'use strict';

const chai = require('chai');
const sinon = require('sinon');
const MasterWAMPServer = require('./MasterWAMPServer');
const MasterWAMPRequestSchema = require('./schemas').MasterWAMPRequestSchema;
const MasterWAMPResponseSchema = require('./schemas').MasterWAMPResponseSchema;
const expect = chai.expect;

describe('MasterWAMPServer', function () {

	describe('constructor', function () {
		let fakeSCServer;

		beforeEach(function () {
			fakeSCServer = {
				on: sinon.spy(),
				sendToWorker: sinon.spy()
			};
		});

		it('create SlaveWAMPServer with socketCluster field', function () {
			const masterWAMPServer = new MasterWAMPServer(fakeSCServer);
			expect(masterWAMPServer).to.have.property('socketCluster').to.be.a('object');
		});


		it('should start listening on "workerStart"', function () {
			new MasterWAMPServer(fakeSCServer);
			expect(fakeSCServer.on.calledTwice).to.be.ok;
			expect(fakeSCServer.on.calledWith('workerStart')).to.be.ok;
			expect(fakeSCServer.on.getCalls()[0].args[1]).to.be.a('function');
		});

		it('should start listening on "workerMessage"', function () {
			new MasterWAMPServer(fakeSCServer);
			expect(fakeSCServer.on.calledTwice).to.be.ok;
			expect(fakeSCServer.on.calledWith('workerMessage')).to.be.ok;
			expect(fakeSCServer.on.getCalls()[1].args[1]).to.be.a('function');
		});

		describe('socketCluster.on("workerMessage")', function () {

			let masterWAMPServer;

			const validMasterWAMPRequest = {
				workerId: 0,
				socketId: 'AYX',
				type: MasterWAMPRequestSchema.id,
				procedure: 'methodA',
				signature: 0,
				data: {},
			};

			const validInterProcessRPCRequest = {
				type: '/InterProcessRPCRequestSchema',
				procedure: 'updatePeer',
				data: {},
				socketId: '127.0.0.1:8000',
				workerId: 0,
				signature: 0
			};


			beforeEach(function () {
				fakeSCServer = {
					on: sinon.spy(),
					sendToWorker: sinon.spy()
				};
				masterWAMPServer = new MasterWAMPServer(fakeSCServer);
				masterWAMPServer.processWAMPRequest = sinon.spy();
			});

			it('should call processWAMPRequest when proper InterProcessRPCRequestSchema param passed to "workerMessage" handler', function () {
				const onWorkerMessageHandler = fakeSCServer.on.getCalls()[1].args[1];
				onWorkerMessageHandler(0, validInterProcessRPCRequest);
				expect(masterWAMPServer.processWAMPRequest.called).to.be.ok;
			});

			it('should call processWAMPRequest when proper MasterWAMPRequest param passed to "workerMessage" handler', function () {
				const onWorkerMessageHandler = fakeSCServer.on.getCalls()[1].args[1];
				onWorkerMessageHandler(0, validMasterWAMPRequest);
				expect(masterWAMPServer.processWAMPRequest.called).to.be.ok;
			});

			it('should call processWAMPRequest when proper MasterWAMPRequestSchema with received request', function () {
				const onWorkerMessageHandler = fakeSCServer.on.getCalls()[1].args[1];
				onWorkerMessageHandler(0, validMasterWAMPRequest);
				expect(masterWAMPServer.processWAMPRequest.calledWith(validMasterWAMPRequest)).to.be.ok;
			});

			it('should not call processWAMPRequest when invalid MasterWAMPRequestSchema passed', function () {
				const onWorkerMessageHandler = fakeSCServer.on.getCalls()[1].args[1];
				const invalidMasterWAMPCall = Object.assign({}, validMasterWAMPRequest, {type: 'invalid'});
				onWorkerMessageHandler(0, invalidMasterWAMPCall);
				expect(masterWAMPServer.processWAMPRequest.called).not.to.be.ok;
			});

			it('should not call processWAMPRequest when empty request passed', function () {
				const onWorkerMessageHandler = fakeSCServer.on.getCalls()[1].args[1];
				onWorkerMessageHandler(0, null);
				expect(masterWAMPServer.processWAMPRequest.called).not.to.be.ok;
			});
		});

	});

});
