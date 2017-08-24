/* eslint-env node, mocha */
const sinon = require('sinon');
const { expect } = require('../testSetup.spec');

const ClientRequestCleaner = require('./ClientRequestCleaner');

describe('ClientRequestsCleaner', () => {
	let clientRequestsCleaner;
	const validTimeoutMs = 1;
	const validIntervalMs = 1;
	const validProcedure = 'validProcedure';
	const outdatedSignature = `${new Date(2020, 1, 1, 1, 1, 0).getTime()}_0`;
	const validSignature = `${new Date(2020, 1, 1, 1, 1, validTimeoutMs + 1).getTime()}_0`;
	let validSignatureResolvers;
	let outdatedSignatureResolvers;
	let clock;

	before(() => {
		clock = sinon.useFakeTimers(new Date(2020, 1, 1, 1, 1, validTimeoutMs + 1).getTime());
	});

	after(() => {
		clock.restore();
	});

	describe('verifySignatures', () => {
		let validCalls;
		validSignatureResolvers = { success: sinon.spy(), reject: sinon.spy() };
		outdatedSignatureResolvers = { success: sinon.spy(), reject: sinon.spy() };
		beforeEach(() => {
			validCalls = {
				[validProcedure]: {
					[outdatedSignature]: outdatedSignatureResolvers,
					[validSignature]: validSignatureResolvers,
				},
			};
			clientRequestsCleaner = new ClientRequestCleaner(validCalls, validIntervalMs, validTimeoutMs);
			clientRequestsCleaner.verifySignatures();
		});

		it('should call reject function on outdated signature', () => {
			expect(outdatedSignatureResolvers.reject.calledWith('RPC response timeout exceeded')).to.be.true();
		});

		it('should not call reject function on valid signature', () => {
			expect(validSignatureResolvers.reject.called).to.be.false();
		});

		it('should not call success function on outdated signature', () => {
			expect(outdatedSignatureResolvers.success.called).to.be.false();
		});

		it('should not call success function on valid signature', () => {
			expect(validSignatureResolvers.success.called).to.be.false();
		});

		it('should remove outdated signature from calls', () => {
			expect(validCalls).to.eql({
				[validProcedure]: {
					[validSignature]: validSignatureResolvers,
				},
			});
		});
	});
});
