"use strict";

const schemas = require('./schemas');

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
			try {
				request = JSON.parse(request);
			} catch (ex) {
				return;
			}
			if (schemas.isValid(request, schemas.WAMPRequestSchema)) {
				this.processWAMPRequest(request, socket);
			} else {

			}
		});

		//register Event endpoints
		Object.keys(this.endpoints.event).forEach(event => {
			socket.on(event, data => {
				this.processWAMPRequest({
					type: schemas.EventRequestSchema.id,
					procedure: event,
					data
				}, socket);
			});
		});

		return socket;
	}

	/**
	 * @param {WAMPRequestSchema} request
	 * @param {SocketCluster.Socket} socket
	 */
	processWAMPRequest(request, socket) {
		if (this.endpoints.rpc[request.procedure] && typeof this.endpoints.rpc[request.procedure] === 'function') {

			return this.endpoints.rpc[request.procedure](request.data, this.reply.bind(this, socket, request));
		}
		else if (this.endpoints.event[request.procedure] && typeof this.endpoints.event[request.procedure] === 'function') {
			return this.endpoints.event[request.procedure](request.data);
		}
		else {
			return this.reply(socket, request, `procedure ${request.procedure} not registered on WAMPServer: ` + JSON.stringify(Object.keys(this.endpoints.rpc)), null);
		}
	}

	/**
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPRequestSchema} request
	 * @param {*} error
	 * @param {*} data
	 */
	reply(socket, request, error, data) {
		const payload = this.createResponsePayload(request, error, data);
		socket.send(JSON.stringify(payload));
	}

	createResponsePayload(request, error, data) {
		return Object.assign({}, request, {
			success: !error,
			data: data,
			error: error,
			type: schemas.reqToResMap[request.type]
		});
	}

	/**
	 * @class RPCEndpoint
	 * @property {function} procedure
	 */

	 /**
	 * @param {Map<RPCEndpoint>} endpoints
	 */
	registerRPCEndpoints(endpoints) {
		this.endpoints.rpc = Object.assign(this.endpoints.rpc, endpoints);
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 */
	registerEventEndpoints(endpoints) {
		this.endpoints.event = Object.assign(this.endpoints.event, endpoints);
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 */
	reassignRPCEndpoints(endpoints) {
		this.endpoints.rpc = endpoints;
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 */
	reassignEventEndpoints(endpoints) {
		this.endpoints.event = endpoints;
	}

}

module.exports = WAMPServer;
