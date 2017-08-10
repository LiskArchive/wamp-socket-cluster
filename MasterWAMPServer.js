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

		socketCluster.on('workerStart', (worker) => {
			this.reply(null, {
				registeredEvents: Object.keys(this.endpoints.event),
				config: config || {},
				type: schemas.MasterConfigRequestSchema.id,
				workerId: worker.id,
			});

			this.workerIndices.push(worker.id);
		});

		socketCluster.on('workerMessage', (worker, request) => {
			if (schemas.isValid(request, schemas.MasterWAMPRequestSchema) ||
				schemas.isValid(request, schemas.InterProcessRPCRequestSchema)) {
				this.processWAMPRequest(request, null);
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
	 * @param {SocketCluster.Socket} socket
	 * @param {WAMPRequestSchema} request
	 * @param {*} error
	 * @param {*} data
	 * @returns {undefined}
	 */
	reply(socket, request, error, data) {
		const payload = MasterWAMPServer.createResponsePayload(request, error, data);
		return this.socketCluster.sendToWorker(request.workerId, payload);
	}
}

module.exports = MasterWAMPServer;
