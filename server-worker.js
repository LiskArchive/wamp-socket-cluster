'use strict';

var dummyData = require('./sc_modules/dummy-data');
var accessControl = require('./sc_modules/access-control');
var authentication = require('./sc_modules/authentication');
var realtimeRest = require('./sc_modules/realtime-rest');

module.exports = function (worker) {


	console.log("hello from server worker");
	var scServer = worker.scServer;
	/*
	 Here we attach some modules to scServer - Each module injects their own logic into the scServer to handle
	 a specific aspect of the system/business logic.
	 */

	// Add some dummy data to our store
	dummyData.attach(scServer);

	// Access control middleware
	accessControl.attach(scServer);

	/*
	 In here we handle our incoming realtime connections and listen for events.
	 */
	scServer.on('connection', function (socket) {
		/*
		 Attach some modules to the socket object - Each one decorates the socket object with
		 additional features or business logic.
		 */

	});




};