'use strict';

const Validator = require('jsonschema').Validator;
const setWith = require('lodash.setwith');
const get = require('lodash.get');
const WAMPServer = require('./WAMPServer');

const MasterWAMPResultSchema = require('./schemas').MasterWAMPResultSchema;
const MasterWAMPCallSchema = require('./schemas').MasterWAMPCallSchema;
const InterProcessRPCResult = require('./schemas').InterProcessRPCResult;

const v = new Validator();

class MasterWAMPServer extends WAMPServer {

	/**
	 * @param {SocketCluster.SocketCluster} worker
	 * @param {Function}[empty function] cb
	 */
	constructor(socketCluster, config) {
		
		super();
		this.socketCluster = socketCluster;

		// socketCluster.on('workerStart', worker => {
		// 	this.reply(null, {
		// 		type:
		// 	}, null, {config});
		// });

		socketCluster.on('workerMessage', (worker, request) => {
			console.log('\x1b[33m%s\x1b[0m', 'MasterWAMPServer: on workerMessage ', request);

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
			if (v.validate(request, MasterWAMPCallSchema).valid) {
				console.log('\x1b[33m%s\x1b[0m', 'MasterWAMPServer: ON workerMessage ----- passed validation invoking RPC procedure:', this.endpoints.rpc[request.procedure]);
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
		console.log('\x1b[36m%s\x1b[0m', 'MasterWAMPServer ----- reply type', request.workerId, request.type === MasterWAMPResultSchema.id ? MasterWAMPResultSchema.id : InterProcessRPCResult.id);
		return this.socketCluster.sendToWorker(request.workerId, {
			data,
			error,
			success: !error,
			type: request.type === MasterWAMPResultSchema.id ? MasterWAMPResultSchema.id : InterProcessRPCResult.id,
		});
	}

}

module.exports = MasterWAMPServer;
