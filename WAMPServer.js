"use strict";

const Validator = require('jsonschema').Validator;

const WAMPResultSchema = require('./schemas').WAMPResultSchema;
const WAMPCallSchema = require('./schemas').WAMPCallSchema;

const v = new Validator();

class WAMPServer {

	constructor() {
		this.registeredEnpoints = {};
	}

	/**
	 * @param {object} socket - SocketCluster.Socket
	 * @returns {object} wampSocket
	 */
	upgradeToWAMP(socket) {
		socket.on('raw', request => {
			try {
				request = JSON.parse(request);
			} catch (ex) {
				return;
			}
			if (v.validate(request, WAMPCallSchema).valid && request.type === WAMPCallSchema.id) {
				this.processWAMPRequest(request, socket);
			}
		});
		return socket;
	}

	/**
	 *
	 * @param {WAMPCallSchema} request
	 * @param {SocketCluster.Socket} socket
	 */
	processWAMPRequest(request, socket) {
		const procedure = this.registeredEnpoints[request.procedure];
		if (procedure) {
			procedure(request.data, this.reply.bind(socket, request));
		} else {
			throw new Error(`Attempt to call unregistered procedure ${request.procedure}`)
		}
	}

	/**
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPCallSchema} request
	 * @param {*} err
	 * @param {*} data
	 */
	reply(socket, request, err, data) {
		socket.send(JSON.stringify({
			success: !err,
			data: err ? err : data,
			type: WAMPResultSchema.id,
			procedure: request.procedure,
			signature: request.signature
		}));
	}

	/**
	 * @class RPCEndpoint
	 * @property {function} procedure
	 *
	 * @param {RPCEndpoint} endpoint
	 */
	addEndpoint(endpoint) {
		this.registeredEnpoints = Object.assign(this.registeredEnpoints, endpoint);
	}

	/**
	 * @param {Array<RPCEndpoint>} endpoints
	 */
	reassignEndpoints(endpoints) {
		this.registeredEnpoints = endpoints;
	}


}

module.exports = WAMPServer;
