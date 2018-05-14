const get = require('./utils').get;
const schemas = require('./schemas');

class WAMPClient {

	/**
	 * @param {Object} socket - SocketCluster.Socket
	 * @returns {Object} wampSocket
	 */
	upgradeToWAMP(socket) {
		if (socket.call) {
			return socket;
		}
		const wampSocket = socket;

		/**
		 * Call procedure registered in WAMPServer
		 * @param {string} procedure
		 * @param {*} data
		 * @returns {Promise}
		 */
		wampSocket.call = (procedure, data) => new Promise((success, fail) => {
			return socket.emit('rpc-request', {
				data,
				procedure,
				signature,
				type: schemas.RPCRequestSchema.id,
			}, (err, result) => {
				if (err) {
					fail(err.toString());
				} else {
					success(result);
				}
			});
		});
		return wampSocket;
	}
}

module.exports = WAMPClient;
