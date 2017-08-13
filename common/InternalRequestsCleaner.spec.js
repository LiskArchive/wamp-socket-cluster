/* eslint-env node, mocha */
const sinon = require('sinon');
const { expect } = require('../testSetup.spec');

const InternalRequestCleaner = require('./InternalRequestsCleaner');
const RequestsCleaner = require('./RequestsCleaner');

describe('InternalRequestsCleaner', () => {

	let internalRequestsCleaner;
	const validTimeoutMs = 1;
	const validIntervalMs = 1;
	const validSocketId = 'validSocketId';
	const validProcedure = 'validProcedure';
	const outdatedSignature = `${new Date(2020, 1, 1, 1, 1, 0).getTime()}_0`;
	const validSignature = `${new Date(2020, 1, 1, 1, 1, validTimeoutMs + 1).getTime()}_0`;
	const validSignatureCallback = sinon.spy();
	const outdatedSignatureCallback = sinon.spy();
	const validCalls = {
		[validSocketId]: {
			[validProcedure]: {
				[outdatedSignature]: outdatedSignatureCallback,
				[validSignature]: validSignatureCallback,
			}
		}
	};
	let timeNow;
	let clock;

	before(function () {
		internalRequestsCleaner = new InternalRequestCleaner(validCalls, validIntervalMs, validTimeoutMs);
		clock = sinon.useFakeTimers(new Date(2020, 1, 1, 1, 1, validTimeoutMs + 1).getTime());
		timeNow = (new Date()).getTime();
	});

	after(() => {
		clock.restore();
	});

	describe('verifySignatures', function () {

		before(function () {
			internalRequestsCleaner.verifySignatures();
		});

		it('should call reject function on outdated signature', function () {
			expect(outdatedSignatureCallback.calledWith('RPC response timeout exceeded')).to.be.true();
		});

		it('should not call success function on valid signature', function () {
			expect(validSignatureCallback.called).to.be.false();
		});

		it('should remove outdated signature from calls', function () {
			expect(validCalls).to.eql({
				[validSocketId]: {
					[validProcedure]: {
						[validSignature]: validSignatureCallback,
					}
				}
			});
		});
	});
});
