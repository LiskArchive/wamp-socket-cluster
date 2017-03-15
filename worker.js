var serverWorker = require('./server-worker');
var clientWorker = require('./client-worker');


var dummyData = require('./sc_modules/dummy-data');
var accessControl = require('./sc_modules/access-control');

module.exports.run = function (worker) {
	console.log('   >> Worker PID:', process.pid);

	worker.scServer.global.counter = worker.scServer.global.counter || 0;

	var count = worker.scServer.global.counter;

	console.log(count);
	if (count === 0) {
		serverWorker(worker);
	}

	worker.scServer.global.counter += 1;
};