const schemas = require('./schemas');

class WAMPServer {
	constructor() {
		this.endpoints = {
			rpc: {},
			event: {},
		};
	}

	/**
	 * @param {object} request
	 * @param {Error} error
	 * @param {*} data
	 * @returns {object}
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
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPRequestSchema} request
	 * @param {*} error
	 * @param {*} data
	 */
	static reply(socket, request, error, data) {
		const payload = WAMPServer.createResponsePayload(request, error, data);
		socket.send(JSON.stringify(payload));
	}

	/**
	 * @param {object} socket - SocketCluster.Socket
	 * @returns {object} wampSocket
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
				this.processWAMPRequest(request, socket);
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
	 */
	processWAMPRequest(request, socket) {
		if (this.endpoints.rpc[request.procedure] &&
			typeof this.endpoints.rpc[request.procedure] === 'function') {
			return this.endpoints.rpc[request.procedure](request.data,
				WAMPServer.reply.bind(this, socket, request));
		} else if (this.endpoints.event[request.procedure] &&
			typeof this.endpoints.event[request.procedure] === 'function') {
			return this.endpoints.event[request.procedure](request.data);
		}

		return WAMPServer.reply(socket, request,
			`Procedure ${request.procedure} not registered on WAMPServer. 
			Available commands: ${JSON.stringify(Object.keys(this.endpoints.rpc))}`, null);
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
