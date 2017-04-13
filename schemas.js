'use strict';

module.exports.WAMPResultSchema = {
	id: '/WAMPResult',
	type: 'object',
	properties: {
		type: {type: 'string'},
		procedure: {type: 'string'},
		data: {},
		success: {type: 'boolean'},
		error: {}
	},
	required: ['type', 'procedure', 'success', 'error']
};

module.exports.WAMPCallSchema = {
	id: '/WAMPCall',
	type: 'object',
	properties: {
		type: {type: 'string'},
		procedure: {type: 'string'},
		data: {}
	},
	required: ['type', 'procedure']
};

module.exports.MasterWAMPResultSchema = {
	id: '/ConcurrentWAMPRequest',
	type: 'object',
	properties: {
		workerId: {type: 'number'},
		socketId: {type: 'string'},
		type: {type: 'string'},
		procedure: {type: 'string'},
		data: {},
		success: {type: 'boolean'},
		error: {}
	},
	required: ['workerId', 'socketId', 'type', 'procedure', 'success', 'error']
};

module.exports.MasterWAMPCallSchema = {
	id: '/ConcurrentWAMPRequest',
	type: 'object',
	properties: {
		workerId: {type: 'number'},
		socketId: {type: 'string'},
		type: {type: 'string'},
		procedure: {type: 'string'},
		data: {},
	},
	required: ['workerId', 'socketId', 'type', 'procedure']
};

module.exports.InterProcessRPCResult = {
	id: '/InterProcessRPCResult',
	type: 'object',
	properties: {
		workerId: {type: 'number'},
		socketId: {type: 'string'},
		type: {type: 'string'},
		procedure: {type: 'string'},
		data: {},
		success: {type: 'boolean'},
		error: {}
	},
	required: ['workerId', 'socketId', 'type', 'procedure', 'success', 'error']
};


module.exports.InterProcessRPCRequest = {
	id: '/InterProcessRPCRequest',
	type: 'object',
	properties: {
		workerId: {type: 'number'},
		socketId: {type: 'string'},
		type: {type: 'string'},
		procedure: {type: 'string'},
		data: {},
	},
	required: ['workerId', 'socketId', 'type', 'procedure']
};
