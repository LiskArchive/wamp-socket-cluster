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
	 * @param {Function}[configuredCb=function] configuredCb
	 */
	constructor(worker, configuredCb = () => {}) {
		super();
		this.worker = worker;
		this.sockets = worker.scServer.clients;
		this.interProcessRPC = {};
		this.config = {};

		this.worker.on('masterMessage', response => {
			// console.log('\x1b[36m%s\x1b[0m', 'SlaveWAMPServer --- ON MASTRER MSG --- ', response);
			if (schemas.isValid(response, schemas.MasterWAMPResponseSchema) || schemas.isValid(response, schemas.WAMPResponseSchema)) {
				const socket = this.sockets[response.socketId];
				if (socket) {
					delete response.socketId;
					delete response.workerId;
					response.type = schemas.WAMPRequestSchema.id;
					this.reply(socket, response, response.error, response.data);
				}
				//ToDo: else it is really bad then
			}
			else if (schemas.isValid(response, schemas.InterProcessRPCResponseSchema)) {
				const callback = this.getCall(response);
				if (callback) {
					callback(response.err, response.data);
					this.deleteCall(response);
				}
			}
			else if (schemas.isValid(response, schemas.MasterConfigResponseSchema)) {
				console.log('\x1b[36m%s\x1b[0m', 'SlaveWAMPServer --- ON MASTER MSG --- received config', response.config);
				this.config = Object.assign({}, this.config, response.config);
				if (response.registeredEvents) {
					this.registerEventEndpoints(response.registeredEvents.reduce((memo, event) => {
						memo[event] = () => {};
						return memo;
					}, {}));
				}
				console.log('\x1b[36m%s\x1b[0m', 'SlaveWAMPServer --- ON MASTER CONFIG --- invoke cb',  configuredCb);
				return configuredCb(null, this);
			}
			else if (schemas.isValid(response, schemas.BroadcastSchema)) {
				console.log('\x1b[36m%s\x1b[0m', 'SlaveWAMPServer --- ON BROADCAST MSG --- received brodcast to cleints: ', this.worker.scServer.clients);
				for (const [socketId, socket] of Object.entries(this.worker.scServer.clients)) {
					console.log('\x1b[36m%s\x1b[0m', 'SlaveWAMPServer --- ON BROADCAST MSG --- broadcast to client', socketId);
					socket.emit(response.procedure, response.data);
				}
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
		} else {

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
