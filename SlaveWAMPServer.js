const Validator = require('jsonschema').Validator;
const setWith = require('lodash.setwith');
const get = require('lodash.get');
const WAMPServer = require('./WAMPServer');
const WAMPClient = require('./WAMPClient');
const InternalRequestCleaner = require('./common/InternalRequestsCleaner');

const schemas = require('./schemas');

const v = new Validator();

class SlaveWAMPServer extends WAMPServer {
	/**
	 * @param {SocketCluster.Worker} worker
	 * @param {number} internalRequestsTimeoutMs - time [ms] to wait for responses from master
	 * @param {number} cleanRequestsIntervalMs - frequency [ms] of cleaning outdated requests
	 * @param {Function}[configuredCb=function] configuredCb
	 */
	constructor(
		worker,
		internalRequestsTimeoutMs = 10e3,
		cleanRequestsIntervalMs = 10e3,
		configuredCb = () => {}) {
		super();
		this.worker = worker;
		this.sockets = worker.scServer.clients;
		this.interProcessRPC = {};
		this.endpoints.slaveRpc = {};
		this.config = {};
		this.clientRequestsCleaner = new InternalRequestCleaner(
			this.interProcessRPC, cleanRequestsIntervalMs, internalRequestsTimeoutMs);
		this.clientRequestsCleaner.start();
		this.worker.on('masterMessage', (response) => {
			if (schemas.isValid(response, schemas.MasterWAMPResponseSchema) ||
				schemas.isValid(response, schemas.WAMPResponseSchema)) {
				const socket = this.sockets[response.socketId];
				if (socket) {
					delete response.socketId;
					delete response.workerId;
					response.type = schemas.WAMPRequestSchema.id;
					this.reply(socket, response, response.error, response.data);
				} else {
					throw new Error('Socket that requested RPC call not found anymore');
				}
			} else if (schemas.isValid(response, schemas.InterProcessRPCResponseSchema)) {
				const callback = this.getCall(response);
				if (callback) {
					callback(response.error, response.data);
					this.deleteCall(response);
				}
			} else if (schemas.isValid(response, schemas.MasterConfigResponseSchema)) {
				this.config = Object.assign({}, this.config, response.config);
				if (response.registeredEvents) {
					this.registerEventEndpoints(response.registeredEvents.reduce(
						(memo, event) => Object.assign(memo, { [event]: () => {} }), {}));
				}
				configuredCb(null, this);
			}
		});
	}

	/**
	 * @param {Object}[request={}] request
	 * @returns {WAMPRequestSchema}
	 */
	static normalizeRequest(request = {}) {
		if (!request.procedure || typeof request.procedure !== 'string') {
			throw new Error(`Wrong format of requested procedure: ${request.procedure}`);
		}
		if (!request.socketId || typeof request.socketId !== 'string') {
			throw new Error(`Wrong format of requested socket id: ${request.socketId}`);
		}
		request.procedure = request.procedure.replace(/\./g, '');
		request.socketId = request.socketId.replace(/\./g, '');
		return request;
	}

	/**
	 * @param {string} procedure
	 * @param {*} data
	 * @param {string} socketId
	 * @param {Function} cb
	 * @returns {undefined}
	 */
	sendToMaster(procedure, data, socketId, cb) {
		const req = SlaveWAMPServer.normalizeRequest({
			type: schemas.InterProcessRPCRequestSchema.id,
			procedure,
			data,
			socketId,
			workerId: this.worker.id,
			signature: WAMPClient.generateSignature(get(this.interProcessRPC, `${socketId}.${procedure}`, {})),
		});
		this.worker.sendToMaster(req);

		this.saveCall(req, cb);
	}

	/**
	 * @param {WAMPRequestSchema} request
	 * @param {Object} socket
	 * @returns {undefined}
	 */
	processWAMPRequest(request, socket) {
		if (v.validate(request, schemas.WAMPRequestSchema).valid) {
			request.socketId = socket.id;
			request.workerId = this.worker.id;
			if (this.endpoints.slaveRpc[request.procedure] &&
				typeof this.endpoints.slaveRpc[request.procedure] === 'function') {
				this.endpoints.slaveRpc[request.procedure](request,
					this.reply.bind(this, socket, request));
			} else {
				request.type = schemas.MasterWAMPRequestSchema.id;
				this.worker.sendToMaster(request);
			}
		}
	}

	/**
	 * @param {string} socketId
	 * @returns {boolean}
	 */
	onSocketDisconnect(socketId) {
		return delete this.interProcessRPC[socketId];
	}

	/**
	 * @param {InterProcessRPCRequestSchema} request
	 * @param {Function} cb
	 * @returns {Object}
	 */
	saveCall(request, cb) {
		if (!request) {
			throw new Error('Internal error while attempting to save InterProcessRPCRequest: empty request');
		}
		if (!request.socketId) {
			throw new Error('Internal error while attempting to save InterProcessRPCRequest: missing socketId');
		}
		if (!request.procedure) {
			throw new Error('Internal error while attempting to save InterProcessRPCRequest: missing procedure');
		}
		if (!request.signature) {
			throw new Error('Internal error while attempting to save InterProcessRPCRequest: missing signature');
		}
		if (!cb) {
			throw new Error('Cannot save a call without callback');
		}
		return setWith(this.interProcessRPC, `${request.socketId}.${request.procedure}.${request.signature}`, cb, Object);
	}

	/**
	 * @param {InterProcessRPCRequestSchema}[request={}] request
	 * @returns {Function|false}
	 */
	getCall(request = {}) {
		return get(this.interProcessRPC, `${request.socketId}.${request.procedure}.${request.signature}`, false);
	}


	/**
	 * @param {InterProcessRPCResponseSchema} request
	 * @returns {boolean}
	 */
	deleteCall(request) {
		if (!request) {
			throw new Error('Internal error while attempting to delete InterProcessRPCRequest: empty request');
		}
		if (!request.socketId) {
			throw new Error('Internal error while attempting to delete InterProcessRPCRequest: missing socketId');
		}
		if (!request.procedure) {
			throw new Error('Internal error while attempting to delete InterProcessRPCRequest: missing procedure');
		}
		if (!request.signature) {
			throw new Error('Internal error while attempting to delete InterProcessRPCRequest: missing signature');
		}
		if (!this.getCall(request)) {
			throw new Error(`There are no internal requests registered for socket: ${request.socketId}, procedure: ${request.procedure} with signature ${request.signature}`);
		}
		return delete this.interProcessRPC[request.socketId][request.procedure][request.signature];
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 * @returns {undefined}
	 */
	reassignRPCSlaveEndpoints(endpoints) {
		this.endpoints.slaveRpc = endpoints;
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 * @returns {undefined}
	 */
	registerRPCSlaveEndpoints(endpoints) {
		this.endpoints.slaveRpc = Object.assign(this.endpoints.slaveRpc, endpoints);
	}
}

module.exports = SlaveWAMPServer;
