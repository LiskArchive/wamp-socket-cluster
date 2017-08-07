const SocketCluster = require('socketcluster').SocketCluster;

const options = {
	workers: 1,
	port: 8000,
	wsEngine: 'uws',
	appName: 'wampSocketCluster',
	workerController: `${__dirname}/serverWorker.js`,
};

const SOCKET_CLUSTER_KEY = Symbol.for('App.SocketClusterServer');
const globalSymbols = Object.getOwnPropertySymbols(global);
const hasSocketCluster = (globalSymbols.indexOf(SOCKET_CLUSTER_KEY) > -1);

if (!hasSocketCluster) {
	global[SOCKET_CLUSTER_KEY] = {
		socketCluster: new SocketCluster(options),
	};
}

const socketClusterSingleton = {
	getInstance: () => global[SOCKET_CLUSTER_KEY],
};

module.exports = socketClusterSingleton;
