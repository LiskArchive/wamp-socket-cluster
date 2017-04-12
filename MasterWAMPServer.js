'use strict';

const Validator = require('jsonschema').Validator;
const setWith = require('lodash.setwith');
const get = require('lodash.get');
const WAMPServer = require('./WAMPServer');

const ConcurrentWAMPResultSchema = require('./schemas').MasterWAMPResultSchema;
const MasterConfigSchema = require('./schemas').MasterConfigSchema;
const WAMPCallSchema = require('./schemas').WAMPCallSchema;

const v = new Validator();

class MasterWAMPServer extends WAMPServer {

	/**
	 * @param {SocketCluster.SocketCluster} worker
	 * @param {Function}[empty function] cb
	 */
	constructor(socketCluster) {
		
		super();
		this.socketCluster = socketCluster;

		socketCluster.on('workerStart', worker => {
			console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: workerStart ----- workerID:', worker.id, {
				endpoints: {
					rpc: Object.keys(this.endpoints.rpc),
					event: Object.keys(this.endpoints.event)
				}
			});

			socketCluster.sendToWorker(worker.id, {
				endpoints: {
					rpc: Object.keys(this.endpoints.rpc),
					event: Object.keys(this.endpoints.event)
				}
			});
		});

		socketCluster.on('workerMessage', (worker, request) => {
			// console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: ON workerMessage ----- request:', request);
			// //ToDo: different validation for WAMP and EVENT
			// if (request.procedure) {
			// 	if (this.endpoints.rpc[request.procedure]) {
			// 		console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: ON workerMessage ----- invoking RPC procedure:', this.endpoints.rpc[request.procedure]);
			// 		this.endpoints.rpc[request.procedure](request.data, function (err, response) {
			// 			console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: ON workerMessage ----- invoking RPC callback ---- response', response, 'err', err);
			// 			response = Object.assign(request, {data: response, err: err, success: !err});
			// 			socketCluster.sendToWorker(response.workerId, response);
			// 		});
			// 	} else if (this.endpoints.event[request.procedure]) {
			// 		console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: ON workerMessage ----- invoking EVENT procedure:', this.endpoints.event[request.procedure]);
			// 		this.endpoints.event[request.procedure](request.data, function (err, message) {
			// 			//ToDo: typical error message handler
			//
			// 		});
			// 	}
			// }
			if (v.validate(request, ConcurrentWAMPResultSchema).valid) {
				console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: ON workerMessage ----- invoking RPC procedure:', this.endpoints.rpc[request.procedure]);
				this.processWAMPRequest(request, null);
			}
		});

	}

	/**
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPCallSchema} request
	 * @param {*} error
	 * @param {*} data
	 */
	reply(socket, request, error, data) {
		return this.socketCluster.sendToWorker(request.workerId, {
			data,
			error,
			success: !error,
			type: MasterWAMPServer.id,
		});
	}

	registerRPCEndpoints(endpoints) {
		console.log('\x1b[36m%s\x1b[0m', 'ENDPOINTS: registerRPCEndpoints', endpoints);
		this.endpoints.rpc = Object.assign(this.endpoints.rpc, endpoints);
	}

	registerEventEndpoints(endpoints) {
		console.log('\x1b[36m%s\x1b[0m', 'ENDPOINTS: registerEVENTEndpoints', endpoints);
		this.endpoints.event = Object.assign(this.endpoints.event, endpoints);
	}

}

module.exports = MasterWAMPServer;
