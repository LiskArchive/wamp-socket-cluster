const WAMPServer = require('./WAMPServer');
const schemas = require('./schemas');

class MasterWAMPServer extends WAMPServer {
	/**
	 * @param {SocketCluster.SocketCluster} socketCluster
	 * @param {Object} config
	 */
	constructor(socketCluster, config) {
		super();
		this.socketCluster = socketCluster;
		this.workerIndices = [];
		this.config = config;
		socketCluster.on('workerStart', (worker) => {
			this.broadcastConfigToWorkers([worker.id]);
			this.workerIndices.push(worker.id);
		});

		socketCluster.on('workerMessage', (workerId, request, respond) => {
			if (schemas.isValid(request, schemas.EventRequestSchema) ||
				schemas.isValid(request, schemas.MasterRPCRequestSchema) ||
				schemas.isValid(request, schemas.InterProcessRPCRequestSchema)) {
				this.processWAMPRequest(request, respond);
			}
		});

		socketCluster.on('workerExit', (workerInfo) => {
			const existingWorkerIndex = this.workerIndices.indexOf(workerInfo.id);
			if (existingWorkerIndex === -1) {
				return;
			}
			this.workerIndices.splice(existingWorkerIndex, 1);
		});
	}

	/**
	 * @param {Array} workerIds
	 * @returns {undefined}
	 */
	broadcastConfigToWorkers(workerIds) {
		workerIds.forEach((workerId) => {
			this.socketCluster.sendToWorker(workerId, {
				type: schemas.MasterConfigRequestSchema.id,
				registeredEvents: Object.keys(this.endpoints.event),
				config: this.config || {},
			});
		});
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 * @returns {undefined}
	 */
	registerEventEndpoints(endpoints) {
		super.registerEventEndpoints(endpoints);
		this.broadcastConfigToWorkers(this.workerIndices);
	}

	/**
	 * @param {Map<RPCEndpoint>} endpoints
	 * @returns {undefined}
	 */
	registerRPCEndpoints(endpoints) {
		super.registerRPCEndpoints(endpoints);
		this.broadcastConfigToWorkers(this.workerIndices);
	}
}

module.exports = MasterWAMPServer;
