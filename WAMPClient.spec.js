/* eslint-env node, mocha */
const sinon = require('sinon');
const Validator = require('jsonschema').Validator;
const { expect } = require('./testSetup.spec');

const v = new Validator();

const WAMPClient = require('./WAMPClient.js');
const RPCResponseSchema = require('./schemas').RPCResponseSchema;

describe('WAMPClient', () => {
	let fakeSocket;
	let clock;
	let frozenSignature;
	const validProcedure = 'validProcedure';

	beforeEach(() => {
		clock = sinon.useFakeTimers(new Date(2020, 1, 1).getTime());
		frozenSignature = `${(new Date()).getTime()}_0`;
	});

	afterEach(() => {
		clock.restore();
	});

	beforeEach(() => {
		fakeSocket = {
			on: sinon.spy(),
		};
	});

	describe('upgradeToWAMP', () => {
		it('should add emit function to given parameter', () => {
			const wampSocket = new WAMPClient().upgradeToWAMP(fakeSocket);
			expect(wampSocket).to.have.property('call').to.be.a('function');
		});

		it('should return passed socket when call and raw event listener are present', () => {
			fakeSocket.call = () => {};
			fakeSocket.listeners = () => ({ length: true });
			const returnedSocket = new WAMPClient().upgradeToWAMP(fakeSocket);
			expect(returnedSocket).to.equal(fakeSocket);
		});
	});

	describe('wampSocket', () => {
		describe('call', () => {
			let wampClient;
			let wampSocket;
			const someArgument = {
				propA: 'valueA',
			};

			beforeEach(() => {
				wampClient = new WAMPClient(fakeSocket);
				wampSocket = {
					emit: sinon.spy(),
					on: sinon.spy(),
				};
				wampSocket = wampClient.upgradeToWAMP(wampSocket);
			});

			it('should return a promise', () => {
				expect(wampSocket.call()).to.be.a('promise');
			});

			it('should invoke socket.emit function', () => {
				wampSocket.call(validProcedure);
				expect(wampSocket.emit.calledOnce).to.be.true();
			});

			it('should invoke socket.emit function with passed 3 arguments', () => {
				wampSocket.call(validProcedure, someArgument);
				expect(wampSocket.emit.getCalls()[0].args.length).equal(3);
			});

			it('should invoke socket.emit function with "rpc-request" as first argument', () => {
				wampSocket.call(validProcedure, someArgument);
				expect(wampSocket.emit.getCalls()[0].args[0]).equal('rpc-request');
			});

			it('should invoke socket.emit function with passed RPC query as second argument', () => {
				wampSocket.call(validProcedure, someArgument);
				const rpcQuery = wampSocket.emit.getCalls()[0].args[1];
				expect(rpcQuery).to.have.property('data').eql({ propA: 'valueA' });
				expect(rpcQuery).to.have.property('procedure').equal(validProcedure);
				expect(rpcQuery).to.have.property('type').equal('/RPCRequest');
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
						type: RPCResponseSchema.id,
						procedure: validProcedure,
						data: validData,
					};
					invalidWampServerResponseError = 'Failed to perform RPC';
				});

				it('should resolve with passed data when server responds when passed valid WAMPResult', (done) => {
					expect(v.validate(validWampServerResponse, RPCResponseSchema).valid).to.be.true();

					wampSocket.call(validProcedure).then((data) => {
						expect(data).equal(validWampServerResponse.data);
						done();
					}).catch((err) => {
						expect(err).to.be.empty();
					});

					const mockedServerResponse = wampSocket.emit.getCalls()[0].args[2];
					mockedServerResponse(null, validWampServerResponse);
				});

				it('should reject with passed data when server responds with invalid WAMPResult', (done) => {
					wampSocket.call(validProcedure).then((data) => {
						expect(data).to.be.empty();
					}).catch((err) => {
						expect(err).equal(invalidWampServerResponseError);
						done();
					});

					const mockedServerResponse = wampSocket.emit.getCalls()[0].args[2];
					mockedServerResponse(invalidWampServerResponseError);
				});


				describe('when requestsTimeoutMs is exceeded', () => {
					let callRejectionSpy;

					beforeEach((done) => {
						clock.restore();
						wampSocket.ackTimeout = 1;
						callRejectionSpy = sinon.spy();
						wampSocket.call(validProcedure, validData).catch(callRejectionSpy);
						const mockedServerResponse = wampSocket.emit.getCalls()[0].args[2];
						mockedServerResponse(new Error('RPC response timeout exceeded'));
						setTimeout(done, wampSocket.ackTimeout + 1);
					});

					it('should reject promise', () => {
						expect(callRejectionSpy.calledOnce).to.be.true();
					});

					it('should reject promise with error = "RPC response timeout exceeded"', () => {
						const error = new Error('RPC response timeout exceeded');
						expect(callRejectionSpy.calledWithExactly(error.toString())).to.be.true();
					});
				});
			});
		});
	});
});
