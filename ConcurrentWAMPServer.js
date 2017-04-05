'use strict';

const Validator = require('jsonschema').Validator;
const setWith = require('lodash.setwith');
const get = require('lodash.get');
const WAMPServer = require('./WAMPServer');

const ConcurrentWAMPResultSchema = require('./schemas').ConcurrentWAMPResultSchema;

const v = new Validator();

class ConcurrentWAMPServer extends WAMPServer {

	constructor(worker, sockets) {
		super();
		this.worker = worker;
		this.RPCCalls = {};

		this.worker.on('masterMessage', response => {
			if (v.validate(response, ConcurrentWAMPResultSchema).valid && response.type === ConcurrentWAMPResultSchema.id) {
				const socket = sockets[response.socketId];
				if (this.checkCall(socket, response)) {
					this.reply(socket, response, response.err, response.data);
					this.deleteCall(socket, response);
				}
			}
		});
	}

	processWAMPRequest(request, socket) {
		request.socketId = socket.id;
		request.workerId = this.worker.id;
		this.worker.sendToMaster(request);
		this.saveCall(socket, request);
	}

	onSocketDisconnect(socket) {
		return delete this.RPCCalls[socket.id];
	}

	checkCall(socket, request) {
		return get(this.RPCCalls, socket.id + '.' + request.procedure + '.' + request.signature, false);
	};

	saveCall(socket, request) {
		return setWith(this.RPCCalls, socket.id + '.' + request.procedure + '.' + request.signature, true, Object);
	};

	deleteCall(socket, request) {
		return delete this.RPCCalls[socket.id][request.procedure][request.signature];
	}
}

module.exports = ConcurrentWAMPServer;
