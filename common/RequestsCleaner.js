class RequestsCleaner {

	constructor(calls, clearInterval, timeout) {
		this.calls = calls;
		this.clearInterval = clearInterval;
		this.timeout = timeout;
	}

	static isOutdated(signature, timeout) {
		const signatureTime = +signature.slice(0, 13);
		if (isNaN(signatureTime)) {
			throw new Error('Wrong signature stored in internal RPC calls');
		}
		const timeElapsed = (new Date()).getTime() - signatureTime;
		return timeElapsed > timeout;
	}

	getSignature(calls) {
		throw new Error('getSignature needs to be overwritten');
	}
}

module.exports = RequestsCleaner;
