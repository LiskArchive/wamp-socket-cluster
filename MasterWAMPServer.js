'use strict';

const get = require('lodash.get');
const WAMPServer = require('./WAMPServer');
const schemas = require('./schemas');
const Validator = require('jsonschema').Validator;
const v = new Validator();

class MasterWAMPServer extends WAMPServer {

	/**
	 * @param {SocketCluster.SocketCluster} socketCluster
	 * @param {Object} config
	 */
	constructor(socketCluster, config) {
		
		super();
		this.socketCluster = socketCluster;

		socketCluster.on('workerStart', worker => {
			console.log('\x1b[36m%s\x1b[0m', 'MasterWAMPServer ----- ON WORKER START --- sending conf');

			this.reply(null, {
				registeredEvents: Object.keys(this.endpoints.event),
				config: config || {},
				type: schemas.MasterConfigRequestSchema.id,
				workerId: worker.id
			});
		});

		socketCluster.on('workerMessage', (worker, request) => {
			if (schemas.isValid(request, schemas.MasterWAMPRequestSchema) || schemas.isValid(request, schemas.InterProcessRPCRequestSchema)) {
				this.processWAMPRequest(request, null);
			}
		});
	}

	/**
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPRequestSchema} request
	 * @param {*} error
	 * @param {*} data
	 */
	reply(socket, request, error, data) {
		return this.socketCluster.sendToWorker(request.workerId, this.createResponsePayload(request, error, data));
	}

}

module.exports = MasterWAMPServer;
