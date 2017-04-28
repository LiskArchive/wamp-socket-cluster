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
		this.workerIndices = [];

		socketCluster.on('workerStart', worker => {
			console.log('\x1b[36m%s\x1b[0m', 'MasterWAMPServer ----- ON WORKER START --- sending conf');

			this.reply(null, {
				registeredEvents: Object.keys(this.endpoints.event),
				config: config || {},
				type: schemas.MasterConfigRequestSchema.id,
				workerId: worker.id
			});

			this.workerIndices.push(worker.id);
		});

		socketCluster.on('workerMessage', (worker, request) => {
			if (schemas.isValid(request, schemas.MasterWAMPRequestSchema) || schemas.isValid(request, schemas.InterProcessRPCRequestSchema)) {
				this.processWAMPRequest(request, null);
			}
		});

		socketCluster.on('workerExit', workerInfo =>
			this.workerIndices.splice(this.workerIndices.indexOf(workerInfo.id)), 1);
	}

	broadcast(procedure, data) {
		this.workerIndices.forEach(workerId => {
			console.log('\x1b[36m%s\x1b[0m', 'MasterWAMPServer ----- BROADCASTING TO WORKER: ', workerId);
			this.reply(null, {
				type: schemas.BroadcastSchema.id,
				procedure,
				workerId
			}, null, data);
		});
	}

	/**
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPRequestSchema} request
	 * @param {*} error
	 * @param {*} data
	 */
	reply(socket, request, error, data) {
		console.log('\x1b[36m%s\x1b[0m', 'MasterWAMPServer ----- SENDING REPLY: ', this.createResponsePayload(request, error, data));
		return this.socketCluster.sendToWorker(request.workerId, this.createResponsePayload(request, error, data));
	}

	broadcastConfig(config) {
		console.log('\x1b[36m%s\x1b[0m', 'MasterWAMPServer ----- broadcastConfig --- this.socketCluster', this.socketCluster);
		// this.workerIndices.forEach(workerId => this.socketCluster.sendToWorker(workerId, {
		// 	config,
		// 	type: schemas.MasterConfigRequestSchema.id
		// }));
	}

}

module.exports = MasterWAMPServer;
