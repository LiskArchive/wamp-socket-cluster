"use strict";

const get = require('lodash.get');
const Validator = require('jsonschema').Validator;

const WAMPResponseSchema = require('./schemas').WAMPResponseSchema;
const WAMPRequestSchema = require('./schemas').WAMPRequestSchema;

const v = new Validator();


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
			console.log('\x1b[36m%s\x1b[0m', 'WAMPClient ON RAW MSG', result);
			if (v.validate(result, WAMPResponseSchema).valid && result.type === WAMPResponseSchema.id) {
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
				const signature = (Object.keys(this.callsResolvers[procedure]).length - 1) + 1;
				this.callsResolvers[procedure][signature] = {success, fail};
				socket.send(JSON.stringify({
					data,
					procedure,
					signature,
					type: WAMPRequestSchema.id
				}));
			});
		};
		return socket;
	}
}

module.exports = WAMPClient;
