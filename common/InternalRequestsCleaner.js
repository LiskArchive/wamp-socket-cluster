const RequestsCleaner = require('./RequestsCleaner');

class InternalRequestsCleaner extends RequestsCleaner {

	constructor(calls, clearInterval, timeout) {
		super(calls, clearInterval, timeout);
	}

	verifySignatures() {
		for (const socketId of Object.keys(this.calls)) {
			for (const procedure of Object.keys(this.calls[socketId])) {
				for (const signature of Object.keys(this.calls[socketId][procedure])) {
					if (RequestsCleaner.isOutdated(signature, this.timeoutMs)) {
						this.calls[socketId][procedure][signature]('RPC response timeout exceeded');
						delete this.calls[socketId][procedure][signature];
					}
				}
			}
		}
	}
}

module.exports = InternalRequestsCleaner;
