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
			this.reply(null, {
				registeredEvents: Object.keys(this.endpoints.event),
				type: schemas.MasterConfigRequestSchema.id,
				workerId: worker.id
			});
		});

		socketCluster.on('workerMessage', (worker, request) => {
			if (v.validate(request, schemas.MasterWAMPRequestSchema).valid) {
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
