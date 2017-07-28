'use strict';

const Validator = require('jsonschema').Validator;
const setWith = require('lodash.setwith');
const get = require('lodash.get');
const filter = require('lodash.filter');
const WAMPServer = require('./WAMPServer');
const WAMPClient = require('./WAMPClient');

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
			if (schemas.isValid(response, schemas.MasterWAMPResponseSchema) || schemas.isValid(response, schemas.WAMPResponseSchema)) {
				const socket = this.sockets[response.socketId];
				if (socket) {
					delete response.socketId;
					delete response.workerId;
					response.type = schemas.WAMPRequestSchema.id;
					this.reply(socket, response, response.error, response.data);
				} else {
					throw new Error('Socket that requested RPC call not found anymore');
				}
			}
			else if (schemas.isValid(response, schemas.InterProcessRPCResponseSchema)) {
				const callback = this.getCall(response);
				if (callback) {
					callback(response.error, response.data);
					this.deleteCall(response);
				}
			}
			else if (schemas.isValid(response, schemas.MasterConfigResponseSchema)) {
				this.config = Object.assign({}, this.config, response.config);
				if (response.registeredEvents) {
					this.registerEventEndpoints(response.registeredEvents.reduce((memo, event) => {
						memo[event] = () => {};
						return memo;
					}, {}));
				}
				return configuredCb(null, this);
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
			signature: WAMPClient.generateSignature(get(this.interProcessRPC, `${socketId}.${procedure}`, {}))
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

	normalizeRequest(request = {}) {
		if (!request.procedure || typeof request.procedure !== 'string') {
			throw new Error('Wrong format of requested procedure: ' + request.procedure);
		}
		if (!request.socketId || typeof request.socketId !== 'string') {
			throw new Error('Wrong format of requested socket id: ' + request.socketId);
		}
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
