/* eslint-env node, mocha */
const sinon = require('sinon');
const { expect } = require('../testSetup.spec');

const RequestsCleaner = require('./RequestsCleaner');

describe('RequestsCleaner', () => {

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

});
