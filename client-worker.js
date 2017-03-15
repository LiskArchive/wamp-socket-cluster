"use strict";

var scClient = require('socketcluster-client');

var options = {
	protocol: 'http',
	hostname: '127.0.0.1',
	port: 8000,
	autoReconnect: true
};

function Client(socketCluster) { }

Client.prototype.connect = function () {

	var socket = scClient.connect(options);
	// Initiate the connection to the server
	socket.on('error', function (err) {
		throw 'Socket error - ' + err;
	});
	socket.on('connect', function () {
		console.log('CONNECTED');
	});
	socket.on('rand', function (data) {
		console.log('RANDOM STREAM: ' + data.rand);
	});
	var sampleChannel = socket.subscribe('sample');
	sampleChannel.on('subscribeFail', function (err) {
		console.log('Failed to subscribe to the sample channel due to error: ' + err);
	});
	sampleChannel.watch(function (num) {
		console.log('Sample channel message:', num);
	});
};


module.exports = Client;
