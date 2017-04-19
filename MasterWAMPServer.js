'use strict';

const Validator = require('jsonschema').Validator;
const get = require('lodash.get');
const WAMPServer = require('./WAMPServer');

const schemas = require('./schemas');

const v = new Validator();

class MasterWAMPServer extends WAMPServer {

	/**
	 * @param {SocketCluster.SocketCluster} socketCluster
	 */
	constructor(socketCluster) {
		
		super();
		this.socketCluster = socketCluster;

		socketCluster.on('workerStart', worker => {
			this.reply(null, {
				registeredEvents: Object.keys(this.endpoints.event),
				type: schemas.MasterConfigRequestSchema.id,
				workerId: worker.id
			});
		});

		socketCluster.on('workerMessage', (worker, request) => {
			if (v.validate(request, schemas.MasterWAMPRequestSchema).valid &&
				(request.type === schemas.MasterWAMPRequestSchema.id || request.type === schemas.InterProcessRPCRequestSchema.id)) {

				// request.type = schemas.MasterConfigRequestSchema.id;
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
