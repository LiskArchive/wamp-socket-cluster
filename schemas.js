'use strict';

const WAMPResponseSchema = {
	id: '/WAMPResponse',
	type: 'object',
	properties: {
		data: {},
		error: {},
		procedure: {type: 'string'},
		signature: {type: 'number'},
		success: {type: 'boolean'},
		type: {type: 'string'},
	},
	required: ['type', 'procedure', 'signature', 'success', 'error']
};

const WAMPRequestSchema = {
	id: '/WAMPRequest',
	type: 'object',
	properties: {
		data: {},
		signature: {type: 'number'},
		procedure: {type: 'string'},
		type: {type: 'string'}
	},
	required: ['type', 'procedure']
};

const MasterWAMPResponseSchema = {
	id: '/MasterWAMPResponse',
	type: 'object',
	properties: {
		data: {},
		error: {},
		procedure: {type: 'string'},
		signature: {type: 'number'},
		socketId: {type: 'string'},
		success: {type: 'boolean'},
		type: {type: 'string'},
		workerId: {type: 'number'}
	},
	required: ['workerId', 'socketId', 'signature', 'type', 'procedure', 'success']
};

const MasterWAMPRequestSchema = {
	id: '/MasterWAMPRequest',
	type: 'object',
	properties: {
		data: {},
		procedure: {type: 'string'},
		signature: {type: 'number'},
		socketId: {type: 'string'},
		type: {type: 'string'},
		workerId: {type: 'number'}
	},
	required: ['workerId', 'socketId', 'type', 'procedure']
};

const InterProcessRPCResponseSchema = {
	id: '/InterProcessRPCResponseSchema',
	type: 'object',
	properties: {
		data: {},
		error: {},
		procedure: {type: 'string'},
		signature: {type: 'number'},
		socketId: {type: 'string'},
		success: {type: 'boolean'},
		type: {type: 'string'},
		workerId: {type: 'number'}
	},
	required: ['workerId', 'socketId', 'signature', 'type', 'procedure', 'success']
};


const InterProcessRPCRequestSchema = {
	id: '/InterProcessRPCRequestSchemaSchema',
	type: 'object',
	properties: {
		data: {},
		procedure: {type: 'string'},
		signature: {type: 'number'},
		socketId: {type: 'string'},
		type: {type: 'string'},
		workerId: {type: 'number'}
	},
	required: ['workerId', 'socketId', 'signature', 'type', 'procedure']
};

const MasterConfigResponseSchema = {
	id: '/MasterConfigResponseSchema',
	type: 'object',
	properties: {
		registeredEvents:  {type: 'array'},
		type: {type: 'string'}
	},
	required: ['registeredEvents', 'type']
};

const MasterConfigRequestSchema = {
	id: '/MasterConfigRequestSchema',
	type: 'object',
	properties: {
		type: {type: 'string'}
	},
	required: ['type']
};

const responsesIdsMap = {
	[WAMPResponseSchema.id]: WAMPRequestSchema.id,
	[MasterWAMPResponseSchema.id]: WAMPRequestSchema.id,
	[InterProcessRPCResponseSchema.id]: InterProcessRPCRequestSchema.id,
	[MasterConfigResponseSchema.id]: MasterConfigRequestSchema.id,
};

const requestsIdsMap = {
	[WAMPRequestSchema.id]: WAMPResponseSchema.id,
	[MasterWAMPRequestSchema.id]: WAMPResponseSchema.id,
	[InterProcessRPCRequestSchema.id]: InterProcessRPCResponseSchema.id,
	[MasterConfigRequestSchema.id]: MasterConfigResponseSchema.id,
};

module.exports = {
	WAMPRequestSchema,
	WAMPResponseSchema,
	InterProcessRPCRequestSchema,
	InterProcessRPCResponseSchema,
	MasterWAMPResponseSchema,
	MasterWAMPRequestSchema,
	MasterConfigRequestSchema,
	MasterConfigResponseSchema,
	responsesIdsMap,
	requestsIdsMap
};
