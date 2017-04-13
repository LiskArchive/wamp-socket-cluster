'use strict';

const chai = require('chai');
const sinon = require('sinon');

const Validator = require('jsonschema').Validator;

const v = new Validator();

const WAMPClient = require('./WAMPClient.js');
const WAMPResultSchema = require('./schemas').WAMPResultSchema;

const expect = chai.expect;

describe('WAMPClient', function () {

	let fakeSocket;

	beforeEach(function () {
		fakeSocket = {
			on: sinon.spy()
		};
	});
	describe('constructor', function () {

		it('create wampClient with callsResolver field', function () {
			const wampClient = new WAMPClient();
			expect(wampClient).to.have.property('callsResolvers').to.be.a('object').and.to.be.empty;
		});

	});

	describe('upgradeToWAMP', function () {

		it('should add send function to given parameter', function () {
			const wampSocket = new WAMPClient().upgradeToWAMP(fakeSocket);
			expect(wampSocket).to.have.property('wampSend').to.be.a('function')
		});

	});

	describe('wampSocket', function () {

		describe('send', function () {

			let wampClient, wampSocket;

			const someArgument = {
				propA: 'valueA'
			};

			beforeEach(function () {
				wampClient = new WAMPClient(fakeSocket);
				wampSocket = {
					send: sinon.spy(),
					on: sinon.spy()
				};
				wampSocket = wampClient.upgradeToWAMP(wampSocket);
			});

			it('should return a promise', function () {
				expect(wampSocket.wampSend()).to.be.a('promise');
			});

			it('should create correct entry in wampClient.callsResolvers', function () {
				const procedure = 'procedureA';
				wampSocket.wampSend(procedure);
				expect(wampClient.callsResolvers).to.have.deep.property(`${procedure}.0`);
				expect(wampClient.callsResolvers[procedure][0]).to.have.all.keys('success', 'fail');
				expect(wampClient.callsResolvers[procedure][0].success).to.be.a('function');
				expect(wampClient.callsResolvers[procedure][0].fail).to.be.a('function');
			});

			it('should create 2 correct entries for calling twice the same procedures', function () {
				const procedure = 'procedureA';
				wampSocket.wampSend(procedure);
				wampSocket.wampSend(procedure);
				expect(Object.keys(wampClient.callsResolvers).length).equal(1);
				expect(wampClient.callsResolvers).to.have.deep.property(`${procedure}.0`);
				expect(wampClient.callsResolvers).to.have.deep.property(`${procedure}.1`);
			});

			it('should create 2 correct entries for calling twice different procedures', function () {
				const procedureA = 'procedureA';
				const procedureB = 'procedureB';
				wampSocket.wampSend(procedureA);
				wampSocket.wampSend(procedureB);
				expect(Object.keys(wampClient.callsResolvers).length).equal(2);
				expect(wampClient.callsResolvers).to.have.deep.property(`${procedureA}.0`);
				expect(Object.keys(wampClient.callsResolvers[procedureA]).length).equal(1);
				expect(wampClient.callsResolvers).to.have.deep.property(`${procedureB}.0`);
				expect(Object.keys(wampClient.callsResolvers[procedureB]).length).equal(1);
			});


			it('should not create entries after exceeding the MAX_CALLS_ALLOWED limit', function () {
				const procedure = 'procedureA';

				for (let i = 0; i <= WAMPClient.MAX_CALLS_ALLOWED; i += 1) {
					wampSocket.wampSend(procedure);
				}

				expect(Object.keys(wampClient.callsResolvers[procedure]).length).equal(WAMPClient.MAX_CALLS_ALLOWED);

			});

			it('should invoke socket.emit function', function () {
				const procedure = 'procedureA';

				wampSocket.wampSend(procedure);
				expect(wampSocket.send.calledOnce).to.be.ok;
			});

			it('should invoke socket.emit function with passed arguments', function () {
				const procedure = 'procedureA';
				wampSocket.wampSend(procedure, someArgument);

				expect(wampSocket.send.getCalls().length).equal(1);
				expect(wampSocket.send.getCalls()[0].args.length).equal(1);
				expect(wampSocket.send.getCalls()[0].args[0]).to.equal('{"signature":0,"procedure":"procedureA","type":"/WAMPCall","data":{"propA":"valueA"}}');
			});


			it('should invoke socket.on function', function () {
				const procedure = 'procedureA';

				wampSocket.wampSend(procedure);
				expect(wampSocket.on.calledOnce).to.be.ok;
			});

			it('should invoke socket.on function with passed arguments', function () {
				const procedure = 'procedureA';
				wampSocket.wampSend(procedure, someArgument);

				expect(wampSocket.on.getCalls().length).equal(1);
				expect(wampSocket.on.getCalls()[0].args.length).equal(2);
				expect(wampSocket.on.getCalls()[0].args[0]).equal('raw');
				expect(wampSocket.on.getCalls()[0].args[1]).to.be.a('function');

			});

			it('should resolve with passed data when server responds when passed valid WAMPResult', function (done) {

				const procedure = 'procedureA';
				const sampleWampServerResponse = {
					procedure,
					type: WAMPResultSchema.id,
					signature: 0,
					success: true,
					error: null,
					data: {
						propA: 'valueA'
					}
				};

				expect(v.validate(sampleWampServerResponse, WAMPResultSchema).valid).to.be.ok;

				wampSocket.wampSend(procedure).then(data => {
					expect(data).equal(sampleWampServerResponse.data);
					done();
				}).catch(err => {
					expect(err).to.be.empty;
				});

				const mockedServerResponse = wampSocket.on.getCalls()[0].args[1];
				mockedServerResponse(sampleWampServerResponse);

			});

			it('should reject with passed data when server responds with invalid WAMPResult', function (done) {

				const procedure = 'procedureA';
				const invalidWampServerResponse = {
					procedure,
					type: WAMPResultSchema.id,
					signature: 0,
					success: false,
					error: 'err desc',
					data: {
						propA: 'valueA'
					}
				};

				wampSocket.wampSend(procedure).then(data => {
					expect(data).to.be.empty;
				}).catch(err => {
					expect(err).equal(invalidWampServerResponse.error);
					done();
				});

				const mockedServerResponse = wampSocket.on.getCalls()[0].args[1];
				mockedServerResponse(invalidWampServerResponse);
			});


			it('should throw an error when no request signature provided', function (done) {

				const procedure = 'procedureA';
				const sampleWampServerResponse = Object.assign(someArgument, {
					procedure,
					type: WAMPResultSchema.id,
					success: false,
					error: 'err desc',
					data: {
						propA: 'valueA'
					}
				});

				wampSocket.wampSend(procedure);
				const mockedServerResponse = wampSocket.on.getCalls()[0].args[1];
				try {
					mockedServerResponse(sampleWampServerResponse);
				} catch(err) {
					expect(err.toString()).equal(`Error: Unable to find resolving function for procedure ${procedure} with signature undefined`);
					done();
				}

				done();
			});

			it('should throw an error when wrong request signature provided', function (done) {
				const procedure = 'procedureA';
				const sampleWampServerResponse = Object.assign(someArgument, {
					procedure,
					type: WAMPResultSchema.id,
					signature: 'wrong',
					success: false,
					error: 'err desc',
					data: {
						propA: 'valueA'
					}
				});

				wampSocket.wampSend(procedure);
				const mockedServerResponse = wampSocket.on.getCalls()[0].args[1];
				try {
					mockedServerResponse(sampleWampServerResponse);
				} catch(err) {
					expect(err.toString()).equal(`Error: Unable to find resolving function for procedure ${procedure} with signature wrong`);
					done();
				}
			});
		});

	});

});
