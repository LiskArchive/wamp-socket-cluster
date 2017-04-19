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
			console.log('\x1b[33m%s\x1b[0m', 'MasterWAMPServer: on workerStart --- sending endpoints to new worker', this.endpoints);
			this.reply(null, {
				registeredEvents: Object.keys(this.endpoints.event),
				type: schemas.MasterConfigRequestSchema.id,
				workerId: worker.id
			});
		});

		socketCluster.on('workerMessage', (worker, request) => {
			console.log('\x1b[33m%s\x1b[0m', 'MasterWAMPServer: on workerMessage ', request);
			if (v.validate(request, schemas.MasterWAMPRequestSchema).valid &&
				(request.type === schemas.MasterWAMPRequestSchema.id || request.type === schemas.InterProcessRPCRequestSchema.id)) {
				console.log('\x1b[33m%s\x1b[0m', 'MasterWAMPServer: ON workerMessage ----- passed validation invoking RPC procedure:', request.type);
				// request.type = schemas.MasterConfigRequestSchema.id;
				this.processWAMPRequest(request, null);
			} else {
				console.log('\x1b[36m%s\x1b[0m', 'MasterWAMPServer ON workerMessage ----- WAMPRequestSchema.errors', v.validate(request, schemas.MasterWAMPRequestSchema).errors);
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
		console.log('\x1b[36m%s\x1b[0m', 'MasterWAMPServer ----- reply payload', this.createResponsePayload(request, error, data));
		return this.socketCluster.sendToWorker(request.workerId, this.createResponsePayload(request, error, data));
	}

}

module.exports = MasterWAMPServer;
