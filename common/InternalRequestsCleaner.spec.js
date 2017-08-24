/* eslint-env node, mocha */
const sinon = require('sinon');
const { expect } = require('../testSetup.spec');

const InternalRequestCleaner = require('./InternalRequestsCleaner');

describe('InternalRequestsCleaner', () => {
	let internalRequestsCleaner;
	const validTimeoutMs = 1;
	const validIntervalMs = 1;
	const validSocketId = 'validSocketId';
	const validProcedure = 'validProcedure';
	const outdatedSignature = `${new Date(2020, 1, 1, 1, 1, 0).getTime()}_0`;
	const validSignature = `${new Date(2020, 1, 1, 1, 1, validTimeoutMs + 1).getTime()}_0`;
	let validSignatureCallback;
	let outdatedSignatureCallback;
	let clock;

	before(() => {
		clock = sinon.useFakeTimers(new Date(2020, 1, 1, 1, 1, validTimeoutMs + 1).getTime());
	});

	after(() => {
		clock.restore();
	});

	describe('verifySignatures', () => {
		let validCalls;

		validSignatureCallback = sinon.spy();
		outdatedSignatureCallback = sinon.spy();
		beforeEach(() => {
			validCalls = {
				[validSocketId]: {
					[validProcedure]: {
						[outdatedSignature]: outdatedSignatureCallback,
						[validSignature]: validSignatureCallback,
					},
				},
			};
			internalRequestsCleaner = new InternalRequestCleaner(
				validCalls,
				validIntervalMs,
				validTimeoutMs);
			internalRequestsCleaner.verifySignatures();
		});

		it('should call reject function on outdated signature', () => {
			expect(outdatedSignatureCallback.calledWith('RPC response timeout exceeded')).to.be.true();
		});

		it('should not call success function on valid signature', () => {
			expect(validSignatureCallback.called).to.be.false();
		});

		it('should remove outdated signature from calls', () => {
			expect(validCalls).to.eql({
				[validSocketId]: {
					[validProcedure]: {
						[validSignature]: validSignatureCallback,
					},
				},
			});
		});
	});
});
