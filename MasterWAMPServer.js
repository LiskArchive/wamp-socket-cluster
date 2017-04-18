'use strict';

const Validator = require('jsonschema').Validator;
const setWith = require('lodash.setwith');
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
			if (v.validate(request, schemas.MasterWAMPRequestSchema).valid) {
				console.log('\x1b[33m%s\x1b[0m', 'MasterWAMPServer: ON workerMessage ----- passed validation invoking RPC procedure:', this.endpoints.rpc);
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
		console.log('\x1b[36m%s\x1b[0m', 'MasterWAMPServer ----- reply type', request.workerId, request.type === schemas.MasterWAMPResponseSchema.id ? schemas.MasterWAMPResponseSchema.id : schemas.InterProcessRPCResponseSchema.id);
		return this.socketCluster.sendToWorker(request.workerId, Object.assign(request, {
			data,
			error,
			success: !error,
			procedure: request.procedure,
			workerId: request.workerId,
			socketId: request.socketId,
			signature: request.signature,
			type: schemas.requestsIdsMap[request.type]
		}));
	}

}

module.exports = MasterWAMPServer;
