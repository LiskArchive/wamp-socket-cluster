"use strict";

const get = require('lodash.get');
const schemas = require('./schemas');

class WAMPClient {

	/**
	 * @return {number}
	 */
	static get MAX_CALLS_ALLOWED() {
		return 1000;
	}


	constructor() {
		this.callsResolvers = {};
	}

	/**
	 * @param {object} socket - SocketCluster.Socket
	 * @returns {object} wampSocket
	 */
	upgradeToWAMP(socket) {
		socket.on('raw', result => {
			if (schemas.isValid(result, schemas.WAMPResponseSchema)) {
				console.log('\x1b[36m%s\x1b[0m', 'WAMPClient ----- GET VALID RESPONSE --- procedure / success', result.procedure, result.success, this.callsResolvers);

				const resolvers = get(this.callsResolvers, `${result.procedure}.${result.signature}`);
				if (resolvers) {
					result.success ? resolvers.success(result.data) : resolvers.fail(result.error);
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
		socket.wampSend = (procedure, data) => {
			return new Promise((success, fail) => {
				if (!this.callsResolvers[procedure]) {
					this.callsResolvers[procedure] = {};
				}
				if (Object.keys(this.callsResolvers[procedure]).length >= WAMPClient.MAX_CALLS_ALLOWED) {
					return fail(`No more than ${WAMPClient.MAX_CALLS_ALLOWED} calls allowed`);
				}
				const signature = (new Date()).getTime();
				this.callsResolvers[procedure][signature] = {success, fail};
				console.log('\x1b[36m%s\x1b[0m', 'WAMPClient ----- SEND WAMP RPC ---', procedure, data);
				socket.send(JSON.stringify({
					data,
					procedure,
					signature,
					type: schemas.WAMPRequestSchema.id
				}));
			});
		};
		return socket;
	}
}

module.exports = WAMPClient;
