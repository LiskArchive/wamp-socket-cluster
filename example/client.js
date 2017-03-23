"use strict";

const scClient = require('socketcluster-client');
const WAMPClient = require('../WAMPClient');
const wampClient = new WAMPClient();

const options = {
	protocol: 'http',
	hostname: '127.0.0.1',
	port: 8000,
	autoReconnect: true
};

function Client() { }

Client.prototype.connect = function () {

	this.socket = scClient.connect(options);

	wampClient.upgradeToWAMP(this.socket);

	this.socket.on('error', function (err) {
		throw 'Socket error - ' + err;
	});

	this.socket.on('connect', function () {
		console.log('CONNECTED');
	});

	return this.socket;

};

Client.prototype.callRPCInInterval = function () {

	const interval = setInterval(() => {
		const randNumber =  Math.floor( Math.random() * 5 );
		this.socket.wampSend('multiplyByTwo', 2)
			.then(result => console.log(`RPC result: ${randNumber} * 2 = ${result}`))
			.catch(err => console.error('RPC multiply by two error'));
	}, 1000);

	this.socket.on('disconnect', function () {
		console.log("DISCONNECTED");
		clearInterval(interval)
	} );

};


module.exports = Client;
