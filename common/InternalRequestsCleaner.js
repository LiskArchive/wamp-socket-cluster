const RequestsCleaner = require('./RequestsCleaner');

class InternalRequestsCleaner extends RequestsCleaner {
	verifySignatures() {
		if (!this.calls) {
			return;
		}
		Object.keys(this.calls).forEach((socketId) => {
			Object.keys(this.calls[socketId]).forEach((procedure) => {
				Object.keys(this.calls[socketId][procedure]).forEach((signature) => {
					if (RequestsCleaner.isOutdated(signature, this.timeoutMs)) {
						this.calls[socketId][procedure][signature]('RPC response timeout exceeded');
						delete this.calls[socketId][procedure][signature];
					}
				});
			});
		});
	}
}

module.exports = InternalRequestsCleaner;
