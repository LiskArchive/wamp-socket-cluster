require('./server').getInstance();

const Client = require('./client');

setTimeout(() => {
	const c = new Client();
	c.connect();
	c.callRPCInInterval();
}, 1000);
