'use strict';

const Validator = require('jsonschema').Validator;
const setWith = require('lodash.setwith');
const get = require('lodash.get');
const filter = require('lodash.filter');
const WAMPServer = require('./WAMPServer');

const schemas = require('./schemas');
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
			if (v.validate(response, schemas.MasterWAMPResponseSchema).valid && response.type === schemas.MasterWAMPResponseSchema.id) {
				const socket = this.sockets[response.socketId];
				if (socket) {
					delete response.socketId;
					delete response.workerId;
					response.type = schemas.WAMPResponseSchema.id;
					this.reply(socket, response, response.error, response.data);
				}
				//ToDo: else it is really bad then

			}
			else if (v.validate(response, schemas.InterProcessRPCResponseSchema).valid && response.type === schemas.InterProcessRPCResponseSchema.id) {
				const callback = this.getCall(response);
				if (callback) {
					callback(response.err, response.data);
					this.deleteCall(response);
				}
			}
			else if (v.validate(response, schemas.MasterConfigResponseSchema).valid && response.type === schemas.MasterConfigResponseSchema.id) {
				this.registerEventEndpoints(response.registeredEvents.reduce((memo, event) => {
					memo[event] = () => {};
					return memo;
				}, {}));
			}
		});
	}

	sendToMaster(procedure, data, socketId, cb) {
		const req = this.normalizeRequest({
			type: schemas.InterProcessRPCRequestSchema.id,
			procedure,
			data,
			socketId,
			workerId: this.worker.id,
			signature: (new Date()).getTime()
		});


		this.worker.sendToMaster(req);

		this.saveCall(req, cb);
	}

	processWAMPRequest(request, socket) {
		if (v.validate(request, schemas.WAMPRequestSchema).valid) {
			request.socketId = socket.id;
			request.workerId = this.worker.id;
			request.type = schemas.MasterWAMPRequestSchema.id;
			this.worker.sendToMaster(request);
		}
	}

	onSocketDisconnect(socketId) {
		return delete this.interProcessRPC[socketId];
	}

	normalizeRequest(request) {
		request.procedure = request.procedure.replace(/\./g, '');
		request.socketId = request.socketId.replace(/\./g, '');
		return request;
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
