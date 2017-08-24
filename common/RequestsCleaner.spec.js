/* eslint-env node, mocha */
const sinon = require('sinon');
const { expect } = require('../testSetup.spec');

const RequestsCleaner = require('./RequestsCleaner');

describe('RequestsCleaner', () => {
	let requestsCleaner;
	const validCalls = {};
	const valid10secsTimeout10secs = 10e3;
	const validIntervalMs = 1;

	beforeEach(() => {
		requestsCleaner = new RequestsCleaner(validCalls, validIntervalMs, valid10secsTimeout10secs);
	});

	describe('isOutdated', () => {
		let isOutdated;
		let valid10secOldSignature;
		let valid20secOldSignature;
		let validPresentSignature;

		let clock;

		beforeEach(() => {
			isOutdated = requestsCleaner.isOutdated.bind(requestsCleaner);
			valid20secOldSignature = `${new Date(2020, 1, 1, 1, 1, 0).getTime()}_0`;
			valid10secOldSignature = `${new Date(2020, 1, 1, 1, 1, 10).getTime()}_0`;
			clock = sinon.useFakeTimers(new Date(2020, 1, 1, 1, 1, 20).getTime());
			validPresentSignature = `${(new Date()).getTime()}_0`;
		});

		afterEach(() => {
			clock.restore();
		});

		it('should return true for outdated signature', () => {
			expect(isOutdated(valid20secOldSignature)).to.be.true();
		});

		it('should return false for signatures just as old as timeout', () => {
			expect(isOutdated(valid10secOldSignature)).to.be.false();
		});

		it('should return false for signatures later than timeout', () => {
			expect(isOutdated(validPresentSignature)).to.be.false();
		});

		it('should throw an error when invalid signature is passed', () => {
			const invalidSignature = 'invalidSignature';
			expect(() => isOutdated(invalidSignature)).to.throw('Wrong signature stored in internal RPC calls');
		});
	});

	describe('start', () => {
		let verifySignaturesStub;

		beforeEach(() => {
			verifySignaturesStub = sinon.stub(requestsCleaner, 'verifySignatures');
			clearInterval(requestsCleaner.cleanInterval);
			requestsCleaner.cleanInterval = null;
		});

		afterEach(() => {
			verifySignaturesStub.restore();
		});

		it('should initialize cleanInterval variable', () => {
			requestsCleaner.start();
			expect(requestsCleaner.cleanInterval).to.be.a('object');
		});

		it('keep calling verifySignatures function', (done) => {
			requestsCleaner.start();
			setTimeout(() => {
				expect(requestsCleaner.verifySignatures.callCount).to.be.above(1);
				done();
			}, validIntervalMs * 10);
		});

		it('should throw an error when trying to start cleanInterval twice', () => {
			requestsCleaner.start();
			expect(requestsCleaner.start.bind(requestsCleaner)).to.throw('Requests cleaner is already running');
		});
	});

	describe('stop', () => {
		let verifySignaturesStub;

		beforeEach(() => {
			verifySignaturesStub = sinon.stub(requestsCleaner, 'verifySignatures');
			clearInterval(requestsCleaner.cleanInterval);
			requestsCleaner.cleanInterval = null;
		});

		afterEach(() => {
			verifySignaturesStub.restore();
		});

		it('should not throw an error when cleanInterval is not running', () => {
			expect(requestsCleaner.stop.bind(requestsCleaner)).not.to.throw();
		});

		describe('when cleanInterval running', () => {
			beforeEach(() => {
				requestsCleaner.start();
			});

			it('should set cleanInterval to null', () => {
				requestsCleaner.stop();
				expect(requestsCleaner.cleanInterval).to.be.null();
			});

			it('stop invoking verifySignatures', (done) => {
				requestsCleaner.stop();
				const beforeStopsCallsCount = requestsCleaner.verifySignatures.callCount;
				setTimeout(() => {
					expect(requestsCleaner.verifySignatures.callCount).to.equal(beforeStopsCallsCount);
					done();
				}, validIntervalMs * 10);
			});
		});
	});

	describe('verifySignatures', () => {
		it('should throw an error when called as it must be overwritten by the child', () => {
			expect(requestsCleaner.verifySignatures).to.throw();
		});
	});
});
