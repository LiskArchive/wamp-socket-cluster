/* eslint-env node, mocha */
const sinon = require('sinon');
const { expect } = require('../testSetup.spec');

const RequestsCleaner = require('./RequestsCleaner');

describe('RequestsCleaner', () => {
	let requestsCleaner;
	const validCalls = {};
	const validTimeoutMs = 1;
	const validIntervalMs = 1;

	before(() => {
		requestsCleaner = new RequestsCleaner(validCalls, validIntervalMs, validTimeoutMs);
	});

	describe('isOutdated', () => {
		const isOutdated = RequestsCleaner.isOutdated;
		let valid10secOldSignature;
		let valid20secOldSignature;
		let validPresentSignature;

		const timeout10secs = 10000;

		let clock;

		before(() => {
			valid20secOldSignature = `${new Date(2020, 1, 1, 1, 1, 0).getTime()}_0`;
			valid10secOldSignature = `${new Date(2020, 1, 1, 1, 1, 10).getTime()}_0`;
			clock = sinon.useFakeTimers(new Date(2020, 1, 1, 1, 1, 20).getTime());
			validPresentSignature = `${(new Date()).getTime()}_0`;
		});

		after(() => {
			clock.restore();
		});

		it('should return true for outdated signature', () => {
			expect(isOutdated(valid20secOldSignature, timeout10secs)).to.be.true();
		});

		it('should return false for signatures just as old as timeout', () => {
			expect(isOutdated(valid10secOldSignature, timeout10secs)).to.be.false();
		});

		it('should return false for signatures later than timeout', () => {
			expect(isOutdated(validPresentSignature, timeout10secs)).to.be.false();
		});

		it('should throw an error when invalid signature is passed', () => {
			const invalidSignature = 'invalidSignature';
			expect(() => isOutdated(invalidSignature, timeout10secs)).to.throw('Wrong signature stored in internal RPC calls');
		});
	});

	describe('start', () => {
		let verifySignaturesStub;

		beforeEach(() => {
			clearInterval(requestsCleaner.cleanInterval);
			requestsCleaner.cleanInterval = null;
		});

		before(() => {
			verifySignaturesStub = sinon.stub(requestsCleaner, 'verifySignatures');
		});

		after(() => {
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
			clearInterval(requestsCleaner.cleanInterval);
			requestsCleaner.cleanInterval = null;
		});

		before(() => {
			verifySignaturesStub = sinon.stub(requestsCleaner, 'verifySignatures');
		});

		after(() => {
			verifySignaturesStub.restore();
		});

		it('should not throw an error when cleanInterval is not running', () => {
			expect(requestsCleaner.stop.bind(requestsCleaner)).not.to.throw();
		});

		describe('when cleanInterval running', () => {
			beforeEach(() => {
				if (requestsCleaner.cleanInterval) {
					requestsCleaner.start();
				}
			});

			it('should set cleanInterval to null', () => {
				requestsCleaner.stop();
				expect(requestsCleaner.cleanInterval).to.be.null();
			});

			it('stop invoking verifySignatures', (done) => {
				requestsCleaner.stop();
				setTimeout(() => {
					expect(requestsCleaner.verifySignatures.called).to.be.false();
					done();
				}, validIntervalMs * 3);
			});
		});
	});
});
