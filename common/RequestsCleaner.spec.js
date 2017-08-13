/* eslint-env node, mocha */
const sinon = require('sinon');
const { expect } = require('../testSetup.spec');

const RequestsCleaner = require('./RequestsCleaner');

describe('RequestsCleaner', () => {

	let requestsCleaner;
	const validCalls = {};
	const validTimeoutMs = 1;
	const validIntervalMs = 1;

	before(function () {
		requestsCleaner = new RequestsCleaner(validCalls, validIntervalMs, validTimeoutMs);
	});

	describe('isOutdated', function () {
		const isOutdated = RequestsCleaner.isOutdated;
		let valid10secOldSignature;
		let valid20secOldSignature;
		let validPresentSignature;
		let timeNow;

		const timeout10secs = 10000;

		let clock;

		before(function () {
			valid20secOldSignature = `${new Date(2020, 1, 1, 1, 1, 0).getTime()}_0`;
			valid10secOldSignature = `${new Date(2020, 1, 1, 1, 1, 10).getTime()}_0`;
			clock = sinon.useFakeTimers(new Date(2020, 1, 1, 1, 1, 20).getTime());
			timeNow = (new Date()).getTime();
			validPresentSignature = `${(new Date()).getTime()}_0`;
		});

		after(() => {
			clock.restore();
		});

		it('should return true for outdated signature', function () {
			expect(isOutdated(valid20secOldSignature, timeout10secs)).to.be.true();
		});

		it('should return false for signatures just as old as timeout', function () {
			expect(isOutdated(valid10secOldSignature, timeout10secs)).to.be.false();
		});

		it('should return false for signatures later than timeout', function () {
			expect(isOutdated(validPresentSignature, timeout10secs)).to.be.false();
		});

		it('should throw an error when invalid signature is passed', function () {
			const invalidSignature = 'invalidSignature';
			expect(() => isOutdated(invalidSignature, timeout10secs)).to.throw('Wrong signature stored in internal RPC calls');
		});
	});

	describe('start', function () {

		let verifySignaturesStub;

		beforeEach(function () {
			clearInterval(requestsCleaner.cleanInterval);
			requestsCleaner.cleanInterval = null;
		});

		before(function () {
			verifySignaturesStub = sinon.stub(requestsCleaner, 'verifySignatures');
		});

		after(function () {
			verifySignaturesStub.restore();
		});

		it('should initialize cleanInterval variable', function () {
			requestsCleaner.start();
			expect(requestsCleaner.cleanInterval).to.be.a('object');
		});

		it('keep calling verifySignatures function', function (done) {
			requestsCleaner.start();
			setTimeout(function () {
				expect(requestsCleaner.verifySignatures.callCount).to.be.above(1);
				done();
			}, validIntervalMs * 10);
		});

		it('should throw an error when trying to start cleanInterval twice', function () {
			requestsCleaner.start();
			expect(requestsCleaner.start.bind(requestsCleaner)).to.throw('Requests cleaner is already running');
		});
	});

	describe('stop', function () {

		let verifySignaturesStub;

		beforeEach(function () {
			clearInterval(requestsCleaner.cleanInterval);
			requestsCleaner.cleanInterval = null;
		});

		before(function () {
			verifySignaturesStub = sinon.stub(requestsCleaner, 'verifySignatures');
		});

		after(function () {
			verifySignaturesStub.restore();
		});

		it('should not throw an error when cleanInterval is not running', function () {
			expect(requestsCleaner.stop.bind(requestsCleaner)).not.to.throw();
		});

		describe('when cleanInterval running', function () {

			beforeEach(function () {
				if (requestsCleaner.cleanInterval) {
					requestsCleaner.start();
				}
			});

			it('should set cleanInterval to null', function () {
				requestsCleaner.stop();
				expect(requestsCleaner.cleanInterval).to.be.null;
			});

			it('stop invoking verifySignatures', function () {
				requestsCleaner.stop();
				setTimeout(function () {
					expect(requestsCleaner.verifySignatures.called).to.be.false();
					done();
				}, validIntervalMs * 3);
			});
		});
	});
});
