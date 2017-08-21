const RequestsCleaner = require('./RequestsCleaner');

class ClientRequestsCleaner extends RequestsCleaner {
	verifySignatures() {
		if (!this.calls) {
			return;
		}
		Object.keys(this.calls).forEach((procedure) => {
			Object.keys(this.calls[procedure]).forEach((signature) => {
				if (this.isOutdated(signature)) {
					this.calls[procedure][signature].reject('RPC response timeout exceeded');
					delete this.calls[procedure][signature];
				}
			});
		});
	}
}

module.exports = ClientRequestsCleaner;
