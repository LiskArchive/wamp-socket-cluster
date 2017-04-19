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

			const validMasterWAMPCall = {
				workerId: 0,
				socketId: 'AYX',
				type: MasterWAMPRequestSchema.id,
				procedure: 'methodA',
				data: {},
			};

			const v2 = {
				type: '/InterProcessRPCRequestSchema',
				procedure: 'updatePeer',
				data:
					{ peer:
						{ ip: '127.0.0.1',
							port: 8000,
							state: 1,
							string: '127.0.0.1:8000',
							version: '0.0.0a' },
						extraMessage: 'extraMessage' },
				socketId: '127.0.0.1:8000',
				workerId: 0
			};


			beforeEach(function () {
				fakeSCServer = {
					on: sinon.spy(),
					sendToWorker: sinon.spy()
				};
				masterWAMPServer = new MasterWAMPServer(fakeSCServer);
				masterWAMPServer.processWAMPRequest = sinon.spy();
			});

			it('should call processWAMPRequest when proper MasterWAMPRequestSchema param passed to "workerMessage" handler', function () {
				const onWorkerMessageHandler = fakeSCServer.on.getCalls()[1].args[1];
				onWorkerMessageHandler(0, v2);
				expect(masterWAMPServer.processWAMPRequest.calledOnce).to.be.ok;
			});

			it('should call processWAMPRequest when proper MasterWAMPRequestSchema with received request', function () {
				const onWorkerMessageHandler = fakeSCServer.on.getCalls()[1].args[1];
				onWorkerMessageHandler(0, validMasterWAMPCall);
				expect(masterWAMPServer.processWAMPRequest.calledWith(validMasterWAMPCall)).to.be.ok;
			});

			it('should not call processWAMPRequest when invalid MasterWAMPRequestSchema passed', function () {
				const onWorkerMessageHandler = fakeSCServer.on.getCalls()[1].args[1];
				const invalidMasterWAMPCall = Object.assign({}, validMasterWAMPCall, {type: 'invalid'});
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
