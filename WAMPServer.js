const schemas = require('./schemas');

class WAMPServer {
	constructor() {
		this.endpoints = {
			rpc: {},
			event: {},
		};
	}

	/**
	 * @param {Object} request
	 * @param {Error} error
	 * @param {*} data
	 * @returns {Object}
	 */
	static createResponsePayload(request, error, data) {
		return Object.assign({}, request, {
			success: !error,
			data,
			error,
			type: schemas.reqToResMap[request.type],
		});
	}

	/**
	 * @param {Object} socket - SocketCluster.Socket
	 * @returns {Object} wampSocket
	 */
	upgradeToWAMP(socket) {
		// register RPC endpoints
		socket.on('raw', (request) => {
			let parsedRequest;
			try {
				parsedRequest = JSON.parse(request);
			} catch (ex) {
				return;
			}
			if (schemas.isValid(parsedRequest, schemas.WAMPRequestSchema)) {
				this.processWAMPRequest(parsedRequest, socket);
			}
		});

		// register Event endpoints
		Object.keys(this.endpoints.event).forEach((event) => {
			socket.on(event, (data) => {
				this.processWAMPRequest({
					type: schemas.EventRequestSchema.id,
					procedure: event,
					data,
				}, socket);
			});
		});

		return socket;
	}

	/**
	 * @param {WAMPRequestSchema} request
	 * @param {SocketCluster.Socket} socket
	 * @returns {undefined}
	 */
	processWAMPRequest(request, socket) {
		if (this.endpoints.rpc[request.procedure] &&
			typeof this.endpoints.rpc[request.procedure] === 'function') {
			return this.endpoints.rpc[request.procedure](request.data,
				this.reply.bind(this, socket, request));
		} else if (this.endpoints.event[request.procedure] &&
			typeof this.endpoints.event[request.procedure] === 'function') {
			return this.endpoints.event[request.procedure](request.data);
		}

		return this.reply(socket, request,
			`Procedure ${request.procedure} not registered on WAMPServer. 
			Available commands: ${JSON.stringify(Object.keys(this.endpoints.rpc))}`, null);
	}

	/**
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPRequestSchema} request
	 * @param {*} error
	 * @param {*} data
	 * @returns {undefined}
	 */
	/* eslint class-methods-use-this: 0 */
	reply(socket, request, error, data) {
		const payload = WAMPServer.createResponsePayload(request, error, data);
		socket.send(JSON.stringify(payload));
	}

	/**
	 * @class RPCEndpoint
	 * @property {function} procedure
	 */

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 * @returns {undefined}
	 */
	registerRPCEndpoints(endpoints) {
		this.endpoints.rpc = Object.assign(this.endpoints.rpc, endpoints);
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 * @returns {undefined}
	 */
	registerEventEndpoints(endpoints) {
		this.endpoints.event = Object.assign(this.endpoints.event, endpoints);
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 * @returns {undefined}
	 */
	reassignRPCEndpoints(endpoints) {
		this.endpoints.rpc = endpoints;
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 * @returns {undefined}
	 */
	reassignEventEndpoints(endpoints) {
		this.endpoints.event = endpoints;
	}
}

module.exports = WAMPServer;
