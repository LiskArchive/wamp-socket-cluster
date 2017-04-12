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
		socketCluster.on('workerStart', function (worker) {
			console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: workerStart ----- workerID:', worker.id, {
				endpoints: {
					rpc: Object.keys(endpoints.rpcEndpoints),
					event: Object.keys(endpoints.eventEndpoints)
				}
			});

			socketCluster.sendToWorker(worker.id, {
				endpoints: {
					rpc: Object.keys(endpoints.rpcEndpoints),
					event: Object.keys(endpoints.eventEndpoints)
				}
			});
		});

		socketCluster.on('workerMessage', function (worker, request) {
			console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: ON workerMessage ----- request:', request);
			//ToDo: different validation for WAMP and EVENT
			if (request.procedure) {
				if (endpoints.rpcEndpoints[request.procedure]) {
					console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: ON workerMessage ----- invoking RPC procedure:', endpoints.rpcEndpoints[request.procedure]);
					endpoints.rpcEndpoints[request.procedure](request.data, function (err, response) {
						console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: ON workerMessage ----- invoking RPC callback ---- response', response, 'err', err);
						response = _.extend(request, {data: response, err: err, success: !err});
						socketCluster.sendToWorker(response.workerId, response);
					});
				} else if (endpoints.eventEndpoints[request.procedure]) {
					console.log('\x1b[36m%s\x1b[0m', 'MASTER CTRL: ON workerMessage ----- invoking EVENT procedure:', endpoints.eventEndpoints[request.procedure]);
					endpoints.eventEndpoints[request.procedure](request.data, function (err, message) {
						//ToDo: typical error message handler

					});
				}
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

		_.filter(this.sockets, function (socket) {
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

module.exports = MasterWAMPServer;
