const schemas = require('./schemas');

class WAMPServer {
	constructor() {
		this.endpoints = {
			rpc: {},
			event: {},
		};
	}

	/**
	 * @param {Object} socket - SocketCluster.Socket
	 * @returns {Object} wampSocket
	 */
	upgradeToWAMP(socket) {
		// register RPC endpoints
		socket.on('rpc-request', (request, respond) => {
			if (schemas.isValid(request, schemas.RPCRequestSchema)) {
				this.processWAMPRequest(request, respond);
			} else {
				respond(`Failed to process RPC request "${request.procedure}" because the request schema was not valid`);
			}
		});
		// register Event endpoints
		Object.keys(this.endpoints.event).forEach((event) => {
			if (typeof this.endpoints.event[event] === 'function') {
				socket.on(event, this.endpoints.event[event]);
			}
		});

		return socket;
	}

	/**
	 * @param {RPCRequestSchema} request
	 * @param {function} respond
	 * @returns {undefined}
	 */
	processWAMPRequest(request, respond) {
		const isValidWAMPEndpoint = (endpointType, procedure) =>
			this.endpoints[endpointType][procedure] &&
			typeof this.endpoints[endpointType][procedure] === 'function';

		if (isValidWAMPEndpoint('rpc', request.procedure)) {
			return this.endpoints.rpc[request.procedure](request.data, (error, data) => {
				respond(error, {
					type: schemas.RPCResponseSchema.id,
					data,
				});
			});
		} else if (isValidWAMPEndpoint('event', request.procedure)) {
			return this.endpoints.event[request.procedure](request.data);
		}
		return respond(`Procedure ${
			request.procedure
		} not registered on WAMPServer. Available commands: ${
			this.endpoints
		}`);
	}

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
