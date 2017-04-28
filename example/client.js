"use strict";

const scClient = require('socketcluster-client');
const WAMPClient = require('../WAMPClient');
const wampClient = new WAMPClient();

let a = 0;
setInterval(() => {
	a += 1;
}, 2000);

function getA() {
	return a;
}
const options = {
	protocol: 'http',
	hostname: '127.0.0.1',
	port: 5000,
	autoReconnect: true,
	query: {
		ip: '127.0.0.1',
		port: 4001,
		nethash: '198f2b61a8eb95fbeed58b8216780b68f697f26b849acf00c8c93bb9b24f783d',
		version: '0.0.0a',
		nonce: 'ABCD',
		a: getA()
	}
};

function Client() { }

Client.prototype.connect = function () {

	this.socket = scClient.connect(options);

	wampClient.upgradeToWAMP(this.socket);

	this.socket.on('error', function (err) {
		console.log('Socket error - ' + err);
	});

	this.socket.on('connect', (data) => {
		console.log('CONNECTED', data, this.socket.authToken, this.socket.dupa);
		// this.socket.wampSend('list', {query: {
		// 	nonce: options.query.nonce
		// }})
		this.socket.wampSend('list', {query: {
			nonce: options.query.nonce
		}})
		.then(myself => {
			console.log('this is me: ', myself);
		})
		.catch(err => {
			console.log('get myself error: ', err);
			this.socket.disconnect();
		});
	});

	this.socket.on('connecting', function () {
		console.log('connecting');
	});

	this.socket.on('connectAbort', function () {
		console.log('connectAbort');
	});

	return this.socket;

};

Client.prototype.callRPCInInterval = function () {

	const interval = setInterval(() => {
		const randNumber =  Math.floor( Math.random() * 5 );
		this.socket.wampSend('dupaRpc', randNumber)
			.then(result => console.log(`RPC result: ${randNumber} * 2 = ${result}`))
			.catch(err => console.error('RPC multiply by two error', err));
	}, 1000);

	setInterval(function () {
		const randNumber =  Math.floor( Math.random() * 5 );
		this.socket.emit('dupaEmit', randNumber);
	}.bind(this), 500);

	this.socket.on('disconnect', function () {
		console.log("DISCONNECTED");
		clearInterval(interval)
	});

};


module.exports = Client;
