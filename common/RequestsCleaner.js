class RequestsCleaner {
	/**
	 * @param {*} calls
	 * @param {number} intervalMs
	 * @param {number} timeoutMs
	 */
	constructor(calls, intervalMs, timeoutMs) {
		this.calls = calls;
		this.intervalMs = intervalMs;
		this.timeoutMs = timeoutMs;
		this.cleanInterval = null;
	}

	start() {
		if (this.cleanInterval) {
			throw new Error('Requests cleaner is already running');
		}
		this.cleanInterval = setInterval(this.verifySignatures, this.intervalMs);
	}

	stop() {
		clearInterval(this.cleanInterval);
		this.cleanInterval = null;
	}

	/**
	 * @param {string} signature
	 * @returns {boolean}
	 */
	isOutdated(signature) {
		const signatureTime = +signature.slice(0, 13);
		if (isNaN(signatureTime)) {
			throw new Error('Wrong signature stored in internal RPC calls');
		}
		const timeElapsed = (new Date()).getTime() - signatureTime;
		return timeElapsed > this.timeoutMs;
	}

	/**
	 * @override
	 */
	// eslint-disable-next-line class-methods-use-this
	verifySignatures() {
		throw new Error('verifySignatures is an abstract function an and must be overridden by the child class or instance');
	}
}

module.exports = RequestsCleaner;
