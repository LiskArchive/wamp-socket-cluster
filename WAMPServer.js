"use strict";

const Validator = require('jsonschema').Validator;

const WAMPResultSchema = require('./schemas').WAMPResultSchema;
const WAMPCallSchema = require('./schemas').WAMPCallSchema;

const v = new Validator();

class WAMPServer {

	constructor() {
		this.registeredEnpoints = {};
	}

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

	processWAMPRequest(request, socket) {
		const procedure = this.registeredEnpoints[request.procedure];
		if (procedure) {
			procedure(request.data, (err, data) => {
				socket.send(JSON.stringify({
					success: !err,
					data: err ? err : data,
					type: WAMPResultSchema.id,
					procedure: request.procedure,
					signature: request.signature
				}));
			});
		} else {
			throw new Error(`Attempt to call unregistered procedure ${request.procedure}`)
		}
	}

	addEndpoint(endpoint) {
		this.registeredEnpoints = Object.assign(this.registeredEnpoints, endpoint);
	}

	reassignEndpoints(endpoints) {
		this.registeredEnpoints = endpoints;
	}
}

module.exports = WAMPServer;
