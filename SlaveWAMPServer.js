'use strict';

const Validator = require('jsonschema').Validator;
const setWith = require('lodash.setwith');
const get = require('lodash.get');
const filter = require('lodash.filter');
const WAMPServer = require('./WAMPServer');

const ConcurrentWAMPResultSchema = require('./schemas').MasterWAMPResultSchema;
const MasterConfigSchema = require('./schemas').MasterConfigSchema;
const WAMPCallSchema = require('./schemas').WAMPCallSchema;

const v = new Validator();

class SlaveWAMPServer extends WAMPServer {

	/**
	 * @param {SocketCluster.Worker} worker
	 * @param {Function}[empty function] cb
	 */
	constructor(worker, cb) {
		super();
		this.worker = worker;
		this.RPCCalls = {};
		this.sockets = worker.scServer.clients;
		cb = typeof cb === 'function' ? cb : function () {};

		this.worker.on('masterMessage', response => {
			if (v.validate(response, ConcurrentWAMPResultSchema).valid) {
				const socket = this.sockets[response.socketId];
				if (this.checkCall(socket, response)) {
					this.reply(socket, response, response.err, response.data);
					this.deleteCall(socket, response);
				}
			}
			else if (v.validate(response, MasterConfigSchema).valid) {
				this.applyMasterConfig(response.data);
				return cb(null, response.data);
			} else {
				return cb(v.validate(response, MasterConfigSchema).errors);
			}
		});
	}

	applyMasterConfig(config) {
		this.config = config;
		this.reassignEndpoints(config.endpoints.rpc.reduce(function (memo, endpoint) {
			memo[endpoint] = true;
			return memo;
		}, {}));
		console.log('\x1b[36m%s\x1b[0m', 'WORKERS masterMessage WILL Setup the sockets: ', scServer.clients);

		filter(this.sockets, function (socket) {
			return !socket.settedUp;
		}).forEach(function (notSetSocket) {
			this.setupSocket(notSetSocket);
		});
	}

	setupSocket(socket) {
		//ToDo: possible problems with registering multiple listeners on same events
		this.config.endpoints.event.forEach(function (endpoint) {
			console.log('\x1b[36m%s\x1b[0m', 'WORKERS CONNECTION ----- REGISTER EVENT ENDPOINT', endpoint);
			socket.on(endpoint, function (data) {
				console.log('\x1b[36m%s\x1b[0m', 'WORKERS CTRL ----- RECEIVED EVENT CALL FOR', endpoint);
				this.worker.sendToMaster({
					procedure: endpoint,
					data: data
				});
			});
		});

		socket.settedUp = true;
		this.upgradeToWAMP(socket);
	}

	reassigndRPCListeners() {
		this.sockets.forEach(function (notSetSocket) {
			this.setupSocket(notSetSocket, worker);
		});
	}

	sendToMaster(procedure, data) {
		this.worker.sendToMaster();
	}

	processWAMPRequest(request, socket) {
		if (v.validate(request, WAMPCallSchema).valid) {
			if (Object.keys(this.registeredEnpoints).indexOf(request.procedure) === -1) {
				return this.reply(socket, request, 'procedure not registered on ConcurrentWAMPServer', null);
			}
			request.socketId = socket.id;
			request.workerId = this.worker.id;
			this.worker.sendToMaster(request);
			this.saveCall(socket, request);
		}
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

module.exports = SlaveWAMPServer;
