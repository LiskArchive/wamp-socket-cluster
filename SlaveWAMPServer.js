const Validator = require('jsonschema').Validator;
const get = require('./utils').get;
const WAMPServer = require('./WAMPServer');
const WAMPClient = require('./WAMPClient');

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
		configuredCb = () => {}) {
		super();
		this.worker = worker;
		this.sockets = worker.scServer.clients;
		this.endpoints.slaveRpc = {};
		this.config = {};
		this.internalRequestsTimeoutMs = internalRequestsTimeoutMs;
		this.worker.on('masterMessage', (payload, respond) => {
			if (schemas.isValid(payload, schemas.MasterConfigRequestSchema)) {
				this.config = Object.assign({}, this.config, payload.config);
				if (payload.registeredEvents) {
					this.registerEventEndpoints(payload.registeredEvents.reduce(
						(memo, event) => Object.assign(memo, { [event]: (data) => {
							this.worker.sendToMaster({
								data,
								procedure: event,
								type: schemas.EventRequestSchema.id,
							});
						} }), {}));
				}
				configuredCb(null, this);
				configuredCb = () => {};
			} else {
				console.error(`Received invalid master message payload of type "${payload.type}"`);
			}
		});
	}

	/**
	 * @param {string} procedure
	 * @param {*} data
	 * @param {Function} callback
	 * @returns {undefined}
	 */
	sendToMaster(procedure, data, callback) {
		const req = {
			type: schemas.InterProcessRPCRequestSchema.id,
			procedure,
			data,
		};
		if (callback) {
			this.worker.sendToMaster(req, (err, response) => {
				if (err) {
					return callback(err);
				}
				return callback(null, response.data);
			});
		} else {
			this.worker.sendToMaster(req);
		}
	}

	/**
	 * @param {RPCRequestSchema} request
	 * @param {Object} respond
	 * @returns {undefined}
	 */
	processWAMPRequest(request, respond) {
		if (v.validate(request, schemas.RPCRequestSchema).valid) {
			if (this.endpoints.slaveRpc[request.procedure] &&
				typeof this.endpoints.slaveRpc[request.procedure] === 'function') {
				this.endpoints.slaveRpc[request.procedure](request, (error, data) => {
					respond(error, {
						type: schemas.RPCResponseSchema.id,
						data,
					});
				});
			} else {
				request.type = schemas.MasterRPCRequestSchema.id;
				this.worker.sendToMaster(request, respond);
			}
		}
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
