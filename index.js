'use strict';

var socketCluster = require('./server').getInstance();

var Client = require('./client-worker');

setTimeout(function () {

	var a = new Client(socketCluster);
	a.connect();

}, 3000);
