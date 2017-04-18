"use strict";

const scClient = require('socketcluster-client');
const WAMPClient = require('../WAMPClient');
const wampClient = new WAMPClient();

const options = {
	protocol: 'http',
	hostname: '127.0.0.1',
	port: 8000,
	autoReconnect: true,
	query: {
		ip: '127.0.0.1',
		port: 8000,
		nethash: '198f2b61a8eb95fbeed58b8216780b68f697f26b849acf00c8c93bb9b24f783d',
		version: '0.0.0a'
	}
};

function Client() { }

Client.prototype.connect = function () {

	this.socket = scClient.connect(options);

	wampClient.upgradeToWAMP(this.socket);

	this.socket.on('error', function (err) {
		throw 'Socket error - ' + err;
	});

	this.socket.on('connect', function (data) {
		console.log('CLIENT CONNECTED AFTER HANDSHAKE', data);
	});

	this.socket.on('connecting', function () {
		console.log('CLIENT STARTED HANDSHAKE');
	});

	this.socket.on('connectAbort', function (data) {
		console.log('CLIENT HANDSHAKE REJECTED', data);
	});

	return this.socket;

};

Client.prototype.callRPCInInterval = function () {
	const interval = setInterval(() => {
		const randNumber =  Math.floor( Math.random() * 5 );
		this.socket.wampSend('dupaRpc', randNumber)
			.then(result => console.log('\x1b[34m%s\x1b[0m', `RPC result: ${randNumber} * 2 = ${result}`))
			.catch(err => console.error('\x1b[35m%s\x1b[0m', 'RPC multiply by two error', err));

		setTimeout(function () {
			this.socket.emit('dupaEmit', randNumber);
		}.bind(this), 500);

	}, 1000);

	this.socket.on('disconnect', function () {
		console.log("DISCONNECTED");
		clearInterval(interval)
	});

};


module.exports = Client;
