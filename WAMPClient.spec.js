'use strict';

const chai = require('chai');
const sinon = require('sinon');

const Validator = require('jsonschema').Validator;

const v = new Validator();

const WAMPClient = require('./WAMPClient.js');
const WAMPResponseSchema = require('./schemas').WAMPResponseSchema;

const expect = chai.expect;

const clock = sinon.useFakeTimers(new Date(2020,1,1).getTime());

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
				expect(Object.keys(wampClient.callsResolvers[procedure]).length).equal(1);
				const signature = Object.keys(wampClient.callsResolvers[procedure])[0];

				expect(wampClient.callsResolvers[procedure][signature]).to.have.all.keys('success', 'fail');
				expect(wampClient.callsResolvers[procedure][signature].success).to.be.a('function');
				expect(wampClient.callsResolvers[procedure][signature].fail).to.be.a('function');
			});

			it('should create 2 correct entries for calling twice the same procedures', function () {
				const procedure = 'procedureA';
				wampSocket.wampSend(procedure);
				wampSocket.wampSend(procedure);
				expect(Object.keys(wampClient.callsResolvers).length).equal(1);
				expect(Object.keys(wampClient.callsResolvers[procedure]).length).equal(2);
				const signatureA = Object.keys(wampClient.callsResolvers[procedure])[0];
				const signatureB = Object.keys(wampClient.callsResolvers[procedure])[1];

				expect(signatureA).to.not.equal(signatureB);
			});


			it('should create 2 correct entries for calling twice different procedures', function () {
				const procedureA = 'procedureA';
				const procedureB = 'procedureB';
				wampSocket.wampSend(procedureA);
				wampSocket.wampSend(procedureB);
				expect(Object.keys(wampClient.callsResolvers).length).equal(2);
				expect(Object.keys(wampClient.callsResolvers[procedureA]).length).equal(1);
				expect(Object.keys(wampClient.callsResolvers[procedureB]).length).equal(1);
			});


			it('should not create entries after exceeding the MAX_CALLS_ALLOWED limit', function () {
				const procedure = 'procedureA';

				for (let i = 0; i <= WAMPClient.MAX_CALLS_ALLOWED; i += 1) {
					wampSocket.wampSend(procedure).catch(() => {});
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
				const signature = JSON.parse(wampSocket.send.getCalls()[0].args[0]).signature;
				expect(wampSocket.send.getCalls()[0].args[0]).to.equal(`{"data":{"propA":"valueA"},"procedure":"procedureA","signature":"${signature}","type":"/WAMPRequest"}`);
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

			describe('resolving responses', function () {

				before(function () {
					sinon.stub(Math, "random").returns(0);
				});


				it('should resolve with passed data when server responds when passed valid WAMPResult', function (done) {

					const procedure = 'procedureA';
					const sampleWampServerResponse = {
						procedure,
						type: WAMPResponseSchema.id,
						signature: (new Date()).getTime() + '_0',
						success: true,
						error: null,
						data: {
							propA: 'valueA'
						}
					};

					expect(v.validate(sampleWampServerResponse, WAMPResponseSchema).valid).to.be.ok;

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
						type: WAMPResponseSchema.id,
						signature: (new Date()).getTime() + '_0',
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
						type: WAMPResponseSchema.id,
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
						type: WAMPResponseSchema.id,
						signature: '99999',
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
						expect(err.toString()).equal(`Error: Unable to find resolving function for procedure ${procedure} with signature ${sampleWampServerResponse.signature}`);
						done();
					}
				});
			});
		});
	});
});
