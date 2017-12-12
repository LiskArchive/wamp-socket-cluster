const rpcEndpoints = {
	multiplyByTwo: (num, cb) => cb(null, num * 2),
};

const eventEndpoints = {
	multiplyByThree: num => console.info(`On server event action 'multiplyByThree': ${num} * 3 = ${num * 3}`),
};

const SCWorker = require('socketcluster/scworker');
const WAMPServer = require('../WAMPServer');

class Worker extends SCWorker {
	run() {
		const scServer = this.scServer;

		const wampServer = new WAMPServer();

		scServer.on('connection', (socket) => {
			wampServer.upgradeToWAMP(socket);

			wampServer.registerRPCEndpoints(rpcEndpoints);
			wampServer.registerEventEndpoints(eventEndpoints);
		});
	}
}

new Worker();
