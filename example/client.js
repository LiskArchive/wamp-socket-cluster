const scClient = require('socketcluster-client');
const WAMPClient = require('../WAMPClient');

const wampClient = new WAMPClient();

const options = {
	protocol: 'http',
	hostname: '127.0.0.1',
	port: 8000,
	autoReconnect: true,
};

function Client() { }

Client.prototype.connect = () => {
	this.socket = scClient.connect(options);

	wampClient.upgradeToWAMP(this.socket);

	this.socket.on('error', (err) => {
		throw new Error(`Socket error - ${err}`);
	});

	this.socket.on('connect', () => {
		console.info('socket client connected');
	});

	return this.socket;
};

Client.prototype.callRPCInInterval = () => {
	const interval = setInterval(() => {
		const randNumber = Math.floor(Math.random() * 5);
		this.socket.call('multiplyByTwo', randNumber)
			.then(result => console.info(`RPC result: ${randNumber} * 2 = ${result}`))
			.catch(err => console.warn('RPC multiply by two error', err));

		this.socket.emit('multiplyByThree', randNumber);
	}, 1000);

	this.socket.on('disconnect', () => {
		console.warn('socket client disconnected');
		clearInterval(interval);
	});
};

module.exports = Client;
