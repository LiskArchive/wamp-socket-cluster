const rpcEndpoints = {
	multiplyByTwo: (num, cb) => cb(null, num * 2),
};

const WAMPServer = require('../WAMPServer');

module.exports.run = (worker) => {
	const scServer = worker.scServer;

	const wampServer = new WAMPServer();

	scServer.on('connection', (socket) => {
		wampServer.upgradeToWAMP(socket);

		wampServer.registerRPCEndpoints(rpcEndpoints);
	});
};
