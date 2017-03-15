'use strict';

var SocketCluster = require('socketcluster').SocketCluster;
var options = {
	workers: 1,
	brokers: 1,
	port: 8000,
	// If your system doesn't support 'uws', you can switch to 'ws' (which is slower but works on older systems).
	wsEngine: 'uws',
	appName: 'lisk',
	workerController: './worker.js',
	brokerController: './broker.js',
	// socketChannelLimit: Number(process.env.SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT) || 1000,
	// clusterStateServerHost: process.env.SCC_STATE_SERVER_HOST || null,
	// clusterStateServerPort: process.env.SCC_STATE_SERVER_PORT || null,
	// clusterAuthKey: process.env.SCC_AUTH_KEY || null,
	// clusterStateServerConnectTimeout: Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null,
	// clusterStateServerAckTimeout: Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null,
	// clusterStateServerReconnectRandomness: Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null,
	crashWorkerOnError: false,
	// If using nodemon, set this to true, and make sure that environment is 'dev'.
	killMasterOnSignal: false
};

var socketCluster;

module.exports = {

	getInstance: function () {

		if (!socketCluster) {
			socketCluster = new SocketCluster(options);
		}
		return socketCluster;

	}
};
