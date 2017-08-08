const rpcEndpoints = {
	multiplyByTwo: (num, cb) => cb(null, num * 2),
};

const eventEndpoints = {
	multiplyByThree: num => console.info(`On server event action 'multiplyByThree': ${num} * 3 = ${num * 3}`),
};

const WAMPServer = require('../WAMPServer');

module.exports.run = (worker) => {
	const scServer = worker.scServer;

	const wampServer = new WAMPServer();

	scServer.on('connection', (socket) => {
		wampServer.upgradeToWAMP(socket);

		wampServer.registerRPCEndpoints(rpcEndpoints);
		wampServer.registerEventEndpoints(eventEndpoints);
	});
};
