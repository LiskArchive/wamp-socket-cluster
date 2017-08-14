const RequestsCleaner = require('./RequestsCleaner');

class ClientRequestsCleaner extends RequestsCleaner {

	constructor(calls, clearInterval, timeout) {
		super(calls, clearInterval, timeout);
	}

	verifySignatures() {
		if (!this.calls) {
			return;
		}
		for (const procedure of Object.keys(this.calls)) {
			for (const signature of Object.keys(this.calls[procedure])) {
				if (RequestsCleaner.isOutdated(signature, this.timeoutMs)) {
					this.calls[procedure][signature].reject('RPC response timeout exceeded');
					delete this.calls[procedure][signature];
				}
			}
		}
	}
}

module.exports = ClientRequestsCleaner;
