"use strict";

const Validator = require('jsonschema').Validator;

const WAMPResultSchema = require('./schemas').WAMPResultSchema;
const WAMPCallSchema = require('./schemas').WAMPCallSchema;

const v = new Validator();

class WAMPServer {

	constructor() {
		this.endpoints = {
			rpc: {},
			event: {}
		};
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
	 * @param {WAMPCallSchema} request
	 * @param {SocketCluster.Socket} socket
	 */
	processWAMPRequest(request, socket) {
		if (this.endpoints.rpc[request.procedure] && typeof this.endpoints.rpc[request.procedure] === 'function') {
			return this.registeredEnpoints[request.procedure](request.data, this.reply.bind(socket, request));
		} else if (this.endpoints.event[request.procedure] && typeof this.endpoints.event[request.procedure] === 'function') {
			return this.registeredEnpoints[request.procedure](request.data);
		} else {
			return this.reply(socket, request, 'procedure not registered on WAMPServer', null);
		}
	}

	/**
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPCallSchema} request
	 * @param {*} error
	 * @param {*} data
	 */
	reply(socket, request, error, data) {
		socket.send(JSON.stringify({
			success: !error,
			data: data,
			error: error,
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
