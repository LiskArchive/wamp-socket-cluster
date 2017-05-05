"use strict";

const get = require('lodash.get');
const schemas = require('./schemas');

class WAMPClient {

	/**
	 * @return {number}
	 */
	static get MAX_CALLS_ALLOWED() {
		return 100;
	}

	static generateSignature(procedureCalls) {
		return `${(new Date()).getTime()}_${(Object.keys(procedureCalls).length - 1) + 1}`;
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
		socket.on('raw', result => {
			if (schemas.isValid(result, schemas.WAMPResponseSchema)) {
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
				const signature = WAMPClient.generateSignature(this.callsResolvers[procedure]);
				this.callsResolvers[procedure][signature] = {success, fail};

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
