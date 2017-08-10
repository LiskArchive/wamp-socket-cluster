const get = require('lodash.get');
const schemas = require('./schemas');

class WAMPClient {
	/**
	 * @return {number}
	 */
	static get MAX_CALLS_ALLOWED() {
		return 100;
	}

	/**
	 * @return {number}
	 */
	static get MAX_GENERATE_ATTEMPTS() {
		return 100000;
	}

	/**
	 * @param {object} procedureCalls
	 * @returns {*}
	 */
	static generateSignature(procedureCalls) {
		const generateNonce = () => Math.ceil(Math.random() * 100000);
		let generateAttempts = 0;
		while (generateAttempts < WAMPClient.MAX_GENERATE_ATTEMPTS) {
			const signatureCandidate = `${(new Date()).getTime()}_${generateNonce()}`;
			if (!procedureCalls[signatureCandidate]) {
				return signatureCandidate;
			}
			generateAttempts += 1;
		}
		return null;
	}

	constructor() {
		this.callsResolvers = {};
	}

	/**
	 * @param {object} socket - SocketCluster.Socket
	 * @returns {object} wampSocket
	 */
	upgradeToWAMP(socket) {
		if (socket.wampSend && socket.listeners('raw').length) {
			return socket;
		}
		const wampSocket = socket;
		wampSocket.on('raw', (result) => {
			if (schemas.isValid(result, schemas.WAMPResponseSchema)) {
				const resolvers = get(this.callsResolvers, `${result.procedure}.${result.signature}`);
				if (resolvers) {
					if (result.success) {
						resolvers.success(result.data);
					} else {
						resolvers.fail(result.error);
					}
					delete this.callsResolvers[result.procedure][result.signature];
				} else {
					throw new Error(`Unable to find resolving function for procedure ${result.procedure} with signature ${result.signature}`);
				}
			}
		});

		/**
		 * Call procedure registered in WAMPServer
		 * @param {string} procedure
		 * @param {*} data
		 * @returns {Promise}
		 */
		wampSocket.wampSend = (procedure, data) => new Promise((success, fail) => {
			if (!this.callsResolvers[procedure]) {
				this.callsResolvers[procedure] = {};
			}
			if (Object.keys(this.callsResolvers[procedure]).length >= WAMPClient.MAX_CALLS_ALLOWED) {
				fail(`No more than ${WAMPClient.MAX_CALLS_ALLOWED} calls allowed`);
			} else {
				const signature = WAMPClient.generateSignature(this.callsResolvers[procedure]);
				if (!signature) {
					fail(`Failed to generate proper signature ${WAMPClient.MAX_GENERATE_ATTEMPTS} times`);
				} else {
					this.callsResolvers[procedure][signature] = { success, fail };
					socket.send(JSON.stringify({
						data,
						procedure,
						signature,
						type: schemas.WAMPRequestSchema.id,
					}));
				}
			}
		});
		return wampSocket;
	}
}

module.exports = WAMPClient;
