"use strict";

const Validator = require('jsonschema').Validator;

const schemas = require('./schemas');

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
			try {
				request = JSON.parse(request);
			} catch (ex) {
				return;
			}
			if (v.validate(request, schemas.WAMPRequestSchema).valid && request.type === schemas.WAMPRequestSchema.id) {
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
			return this.reply(socket, request, `procedure ${request.procedure} not registered on WAMPServer`, null);
		}
	}

	/**
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPRequestSchema} request
	 * @param {*} error
	 * @param {*} data
	 */
	reply(socket, request, error, data) {
		socket.send(JSON.stringify(this.createResponsePayload(request, error, data)));
	}

	createResponsePayload(request, error, data) {
		return Object.assign({}, request, {
			success: !error,
			data: data,
			error: error,
			type: schemas.reqToResMap[request.type],
			procedure: request.procedure,
			signature: request.signature
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
