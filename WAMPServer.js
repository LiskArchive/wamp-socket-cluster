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
		//register RPC endpoints
		socket.on('raw', request => {
			console.log('\x1b[36m%s\x1b[0m', 'WAMPServer ----- RECEIVED RPC CALL', request.procedure);
			try {
				request = JSON.parse(request);
			} catch (ex) {
				return;
			}
			if (v.validate(request, WAMPCallSchema).valid && request.type === WAMPCallSchema.id) {
				this.processWAMPRequest(request, socket);
			}
		});

		//register Event endpoints
		for (const [procedure, handler] of Object.entries(this.endpoints.event)) {
			socket.on(procedure, handler);
		}

		return socket;
	}

	/**
	 * @param {WAMPCallSchema} request
	 * @param {SocketCluster.Socket} socket
	 */
	processWAMPRequest(request, socket) {
		console.log('\x1b[36m%s\x1b[0m', 'WampServer ----- processWAMPRequest received call procedure', request.procedure);

		if (this.endpoints.rpc[request.procedure] && typeof this.endpoints.rpc[request.procedure] === 'function') {
			console.log('\x1b[36m%s\x1b[0m', 'WampServer ----- processWAMPRequest RPC');
			return this.endpoints.rpc[request.procedure](request.data, this.reply.bind(this, socket, request));
		} else if (this.endpoints.event[request.procedure] && typeof this.endpoints.event[request.procedure] === 'function') {
			console.log('\x1b[36m%s\x1b[0m', 'WampServer ----- processWAMPRequest Event');
			return this.endpoints.event[request.procedure](request.data);
		} else {
			console.log('\x1b[36m%s\x1b[0m', 'WampServer ----- processWAMPRequest not registered. reply now');
			return this.reply(socket, request, `procedure ${request.procedure} not registered on WAMPServer`, null);
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
	 */

	 /**
	 * @param {Map<RPCEndpoint>} endpoints
	 */
	registerRPCEndpoints(endpoints) {
		console.log('\x1b[36m%s\x1b[0m', 'ENDPOINTS: registerRPCEndpoints', endpoints);
		this.endpoints.rpc = Object.assign(this.endpoints.rpc, endpoints);
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 */
	registerEventEndpoints(endpoints) {
		console.log('\x1b[36m%s\x1b[0m', 'ENDPOINTS: registerEVENTEndpoints', endpoints);
		this.endpoints.event = Object.assign(this.endpoints.event, endpoints);
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 */
	reassignRPCEndpoints(endpoints) {
		console.log('\x1b[36m%s\x1b[0m', 'ENDPOINTS: reassignPCEndpoints', endpoints);
		this.endpoints.rpc = endpoints;
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 */
	reassignEventEndpoints(endpoints) {
		console.log('\x1b[36m%s\x1b[0m', 'ENDPOINTS: reassignEventEndpoints', endpoints);
		this.endpoints.event = endpoints;
	}

}

module.exports = WAMPServer;
