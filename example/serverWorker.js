'use strict';

const rpcEndpoints = {
	multiplyByTwo: (num, cb) => {
		return cb(null, num * 2);
	}
};

const WAMPServer = require('../WAMPServer');

module.exports.run = function (worker) {

	const scServer = worker.scServer;

	const wampServer = new WAMPServer();

	scServer.on('connection', socket => {
		wampServer.upgradeToWAMP(socket);

		wampServer.reassignEndpoints(rpcEndpoints);
	});
};