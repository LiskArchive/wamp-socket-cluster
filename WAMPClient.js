"use strict";

const get = require('lodash.get');
const Validator = require('jsonschema').Validator;

const WAMPResultSchema = require('./schemas').WAMPResultSchema;
const WAMPCallSchema = require('./schemas').WAMPCallSchema;

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
	 * @param {object} socket
	 * @returns {object} socket
	 */
	upgradeToWAMP(socket) {

		socket.on('raw', result => {
			if (v.validate(result, WAMPResultSchema).valid && result.type === WAMPResultSchema.id) {

				const resolvers = get(this.callsResolvers, `${result.procedure}.${result.signature}`);
				if (resolvers) {
					//{success: false} reject error format- compatible with WAMPServer
					result.success ? resolvers.success(result.data) : resolvers.fail(result.data);

				} else {
					throw new Error(`Unable to find resolving function for procedure ${result.procedure} with signature ${result.signature}`);
				}
			}
		});

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

				socket.send({signature, procedure, type: WAMPCallSchema.id, data});

			});
		};

		return socket;
	}
}


module.exports = WAMPClient;
