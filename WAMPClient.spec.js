/* eslint-env node, mocha */
const sinon = require('sinon');
const Validator = require('jsonschema').Validator;
const { expect } = require('./testSetup.spec');

const v = new Validator();

const WAMPClient = require('./WAMPClient.js');
const WAMPResponseSchema = require('./schemas').WAMPResponseSchema;

describe('WAMPClient', () => {
	let fakeSocket;
	let clock;
	let frozenSignature;
	const validProcedure = 'validProcedure';

	before(() => {
		clock = sinon.useFakeTimers(new Date(2020, 1, 1).getTime());
		frozenSignature = `${(new Date()).getTime()}_0`;
	});

	after(() => {
		clock.restore();
	});

	beforeEach(() => {
		fakeSocket = {
			on: sinon.spy(),
		};
	});
	describe('constructor', () => {
		it('create wampClient with callsResolver field', () => {
			const wampClient = new WAMPClient();
			expect(wampClient).to.have.property('callsResolvers').to.be.a('object').and.to.be.empty();
		});
	});

	describe('upgradeToWAMP', () => {
		it('should add send function to given parameter', () => {
			const wampSocket = new WAMPClient().upgradeToWAMP(fakeSocket);
			expect(wampSocket).to.have.property('wampSend').to.be.a('function');
		});

		it('should return passed socket when wampSend and raw event listener are present', () => {
			fakeSocket.wampSend = () => {};
			fakeSocket.listeners = () => ({ length: true });
			const returnedSocket = new WAMPClient().upgradeToWAMP(fakeSocket);
			expect(returnedSocket).to.equal(fakeSocket);
		});
	});

	describe('generateSignature', () => {
		it('should generate a signature when empty procedureCalls are passed', () => {
			expect(WAMPClient.generateSignature({})).not.to.be.empty();
		});

		it('should generate a signature matching expected format', () => {
			expect(WAMPClient.generateSignature({})).to.be.a('string').and.to.match(/[0-9]{13}_[0-9]{1,6}/);
		});

		it('should return null while attempting to find a signature fails more than MAX_GENERATE_ATTEMPTS times', () => {
			const mathRandomStub = sinon.stub(Math, 'random').returns(0);
			expect(WAMPClient.generateSignature({ [frozenSignature]: true })).to.be.null();
			mathRandomStub.restore();
		});
	});

	describe('wampSocket', () => {
		describe('send', () => {
			let wampClient;
			let wampSocket;
			const someArgument = {
				propA: 'valueA',
			};

			beforeEach(() => {
				wampClient = new WAMPClient(fakeSocket);
				wampSocket = {
					send: sinon.spy(),
					on: sinon.spy(),
				};
				wampSocket = wampClient.upgradeToWAMP(wampSocket);
			});

			it('should return a promise', () => {
				expect(wampSocket.wampSend()).to.be.a('promise');
			});

			it('should create correct entry in wampClient.callsResolvers', () => {
				wampSocket.wampSend(validProcedure);
				expect(Object.keys(wampClient.callsResolvers[validProcedure]).length).equal(1);
				const signature = Object.keys(wampClient.callsResolvers[validProcedure])[0];

				expect(wampClient.callsResolvers[validProcedure][signature]).to.have.all.keys('success', 'fail');
				expect(wampClient.callsResolvers[validProcedure][signature].success).to.be.a('function');
				expect(wampClient.callsResolvers[validProcedure][signature].fail).to.be.a('function');
			});

			it('should create 2 correct entries for calling twice the same procedure', () => {
				wampSocket.wampSend(validProcedure);
				wampSocket.wampSend(validProcedure);
				expect(Object.keys(wampClient.callsResolvers).length).equal(1);
				expect(Object.keys(wampClient.callsResolvers[validProcedure]).length).equal(2);
				const signatureA = Object.keys(wampClient.callsResolvers[validProcedure])[0];
				const signatureB = Object.keys(wampClient.callsResolvers[validProcedure])[1];

				expect(signatureA).to.not.equal(signatureB);
			});


			it('should create 2 correct entries for calling twice different procedures', () => {
				const procedureA = 'procedureA';
				const procedureB = 'procedureB';
				wampSocket.wampSend(procedureA);
				wampSocket.wampSend(procedureB);
				expect(Object.keys(wampClient.callsResolvers).length).equal(2);
				expect(Object.keys(wampClient.callsResolvers[procedureA]).length).equal(1);
				expect(Object.keys(wampClient.callsResolvers[procedureB]).length).equal(1);
			});


			it('should not create entries after exceeding the MAX_CALLS_ALLOWED limit', () => {
				for (let i = 0; i <= WAMPClient.MAX_CALLS_ALLOWED; i += 1) {
					wampSocket.wampSend(validProcedure).catch(() => {});
				}

				expect(Object.keys(wampClient.callsResolvers[validProcedure]).length)
					.equal(WAMPClient.MAX_CALLS_ALLOWED);
			});

			it('should fail while it is impossible to generate a signature', (done) => {
				wampClient.callsResolvers = { [validProcedure]: { [frozenSignature]: true } };
				const mathRandomStub = sinon.stub(Math, 'random').returns(0);
				wampSocket.wampSend(validProcedure)
					.then(() => done('should not be here'))
					.catch((error) => {
						expect(error).to.equal('Failed to generate proper signature 10000 times');
						return done();
					});
				mathRandomStub.restore();
			});

			it('should invoke socket.emit function', () => {
				wampSocket.wampSend(validProcedure);
				expect(wampSocket.send.calledOnce).to.be.true();
			});

			it('should invoke socket.emit function with passed arguments', () => {
				wampSocket.wampSend(validProcedure, someArgument);

				expect(wampSocket.on.calledOnce).to.be.true();
				expect(wampSocket.send.getCalls()[0].args.length).equal(1);
				const signature = JSON.parse(wampSocket.send.getCalls()[0].args[0]).signature;
				expect(wampSocket.send.getCalls()[0].args[0]).to.equal(`{"data":{"propA":"valueA"},"procedure":"${validProcedure}","signature":"${signature}","type":"/WAMPRequest"}`);
			});


			it('should invoke socket.on function', () => {
				wampSocket.wampSend(validProcedure);
				expect(wampSocket.on.calledOnce).to.be.true();
			});

			it('should invoke socket.on function with passed arguments', () => {
				wampSocket.wampSend(validProcedure, someArgument);
				expect(wampSocket.on.calledOnce).to.be.true();
				expect(wampSocket.on.getCalls()[0].args.length).equal(2);
				expect(wampSocket.on.getCalls()[0].args[0]).equal('raw');
				expect(wampSocket.on.getCalls()[0].args[1]).to.be.a('function');
			});

			describe('resolving responses', () => {
				let mathRandomStub;
				let validWampServerResponse;
				let invalidWampServerResponse;
				let validData;
				const validError = 'error description';

				before(() => {
					mathRandomStub = sinon.stub(Math, 'random').returns(0);
				});

				after(() => {
					mathRandomStub.restore();
				});

				beforeEach(() => {
					validData = {
						propA: 'valueA',
					};
					validWampServerResponse = {
						procedure: validProcedure,
						type: WAMPResponseSchema.id,
						signature: frozenSignature,
						success: true,
						error: null,
						data: validData,
					};
					invalidWampServerResponse = {
						procedure: validProcedure,
						type: WAMPResponseSchema.id,
						signature: frozenSignature,
						success: false,
						error: validError,
						data: validData,
					};
				});

				it('should resolve with passed data when server responds when passed valid WAMPResult', (done) => {
					expect(v.validate(validWampServerResponse, WAMPResponseSchema).valid).to.be.true();

					wampSocket.wampSend(validProcedure).then((data) => {
						expect(data).equal(validWampServerResponse.data);
						done();
					}).catch((err) => {
						expect(err).to.be.empty();
					});

					const mockedServerResponse = wampSocket.on.getCalls()[0].args[1];
					mockedServerResponse(validWampServerResponse);
				});

				it('should reject with passed data when server responds with invalid WAMPResult', (done) => {
					wampSocket.wampSend(validProcedure).then((data) => {
						expect(data).to.be.empty();
					}).catch((err) => {
						expect(err).equal(invalidWampServerResponse.error);
						done();
					});

					const mockedServerResponse = wampSocket.on.getCalls()[0].args[1];
					mockedServerResponse(invalidWampServerResponse);
				});


				it('should throw an error when no request signature provided', (done) => {
					wampSocket.wampSend(validProcedure);
					const mockedServerResponse = wampSocket.on.getCalls()[0].args[1];
					try {
						mockedServerResponse(validWampServerResponse);
					} catch (err) {
						expect(err.toString()).equal(`Error: Unable to find resolving function for procedure ${validProcedure} with signature undefined`);
						done();
					}
					done();
				});

				it('should throw an error when provided an invalid request signature', (done) => {
					invalidWampServerResponse.signature = 'invalid signature';
					const sampleWampServerResponse = Object.assign(someArgument, invalidWampServerResponse);
					wampSocket.wampSend(validProcedure);
					const mockedServerResponse = wampSocket.on.getCalls()[0].args[1];
					try {
						mockedServerResponse(sampleWampServerResponse);
					} catch (err) {
						expect(err.toString()).equal(`Error: Unable to find resolving function for procedure ${validProcedure} with signature ${sampleWampServerResponse.signature}`);
						done();
					}
				});
			});
		});
	});
});
