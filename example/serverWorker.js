let counter = 0;

/**
 * All examples every third time will be:
 * - returining valid result
 * - returning example error
 * - not replying at all causing timeouts
 */
const rpcEndpoints = {
	multiplyByTwo: (num, cb) => {
		counter += 1;
		const randomError = counter % 2 === 0 ? null : 'random occurring error';
		if (counter % 3) {
			console.info('For every 3rd call the response is randomly not being returned');
		} else {
			cb(randomError, num * 2);
		}
	},
};

const eventEndpoints = {
	multiplyByThree: (num, cb) => {
		counter += 1;
		const randomError = counter % 2 === 0 ? null : 'random occurring error';
		if (counter % 3) {
			console.info('For every 3rd call the response is randomly not being returned');
		} else {
			cb(randomError, num * 3);
		}
	},
};

const SCWorker = require('socketcluster/scworker');
const WAMPServer = require('../WAMPServer');

class Worker extends SCWorker {
	run() {
		const scServer = this.scServer;

		const wampServer = new WAMPServer();
		wampServer.registerRPCEndpoints(rpcEndpoints);
		wampServer.registerEventEndpoints(eventEndpoints);

		scServer.on('connection', (socket) => {
			wampServer.upgradeToWAMP(socket);
		});
	}
}
module.exports = new Worker();
