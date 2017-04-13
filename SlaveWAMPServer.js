'use strict';

const Validator = require('jsonschema').Validator;
const setWith = require('lodash.setwith');
const get = require('lodash.get');
const filter = require('lodash.filter');
const WAMPServer = require('./WAMPServer');

const MasterWAMPResultSchema = require('./schemas').MasterWAMPResultSchema;
const InterProcessRPCResult = require('./schemas').InterProcessRPCResult;
const InterProcessRPCRequest = require('./schemas').InterProcessRPCRequest;
const WAMPCallSchema = require('./schemas').WAMPCallSchema;

const v = new Validator();

class SlaveWAMPServer extends WAMPServer {

	/**
	 * @param {SocketCluster.Worker} worker
	 * @param {Function}[empty function] cb
	 */
	constructor(worker) {
		super();
		this.worker = worker;
		this.sockets = worker.scServer.clients;
		this.interProcessRPC = {};

		this.worker.on('masterMessage', response => {
			console.log('\x1b[36m%s\x1b[0m', 'SlaveWAMPServer ON masterMessage: workerId', response);
			if (v.validate(response, MasterWAMPResultSchema).valid && response.type === MasterWAMPResultSchema.id) {
				console.log('\x1b[36m%s\x1b[0m', 'SlaveWAMPServer ON passed MasterWAMPResultSchema verification. resp to socket: ', this.sockets[response.socketId]);
				const socket = this.sockets[response.socketId];
				if (socket) {
					this.processWAMPRequest(response, socket);
				}
				//ToDo: else it is really bad then

			}
			else if (v.validate(response, InterProcessRPCResult).valid && response.type === InterProcessRPCResult.id) {
				console.log('\x1b[36m%s\x1b[0m', 'SlaveWAMPServer ON passed MasterWAMPResultSchema verification. resp to call: ', this.getCall(response));
				const callback = this.getCall(response);
				if (callback) {
					callback(response.err, response.data);
					this.deleteCall(response);
				}
			}
		});
	}

	sendToMaster(procedure, data, socketId, cb) {
		console.log('\x1b[36m%s\x1b[0m', 'SlaveWAMPServer sendToMaster: workerId', this.worker);

		this.worker.sendToMaster({
			type: InterProcessRPCRequest.id,
			procedure,
			data,
			socketId,
			workerId: this.worker.id
		});
		this.saveCall(socketId, cb);
	}

	processWAMPRequest(request, socket) {
		if (v.validate(request, WAMPCallSchema).valid) {
			request.socketId = socket.id;
			request.workerId = this.worker.id;
			this.worker.sendToMaster(request);
		}
	}

	onSocketDisconnect(socketId) {
		return delete this.interProcessRPC[socketId];
	}

	getCall(request) {
		return get(this.interProcessRPC, request.socketId + '.' + request.procedure + '.' + request.signature, false);
	};

	saveCall(request, cb) {
		return setWith(this.interProcessRPC, request.socketId + '.' + request.procedure + '.' + request.signature, cb, Object);
	};

	deleteCall(request) {
		return delete this.interProcessRPC[request.socketId][request.procedure][request.signature];
	}
}

module.exports = SlaveWAMPServer;
