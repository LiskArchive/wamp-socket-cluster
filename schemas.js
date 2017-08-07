const Validator = require('jsonschema').Validator;

const v = new Validator();

const WAMPResponseSchema = {
	id: '/WAMPResponse',
	type: 'object',
	properties: {
		data: {},
		error: {},
		procedure: { type: 'string' },
		signature: { type: 'string' },
		success: { type: 'boolean' },
		type: { type: 'string' },
	},
	required: ['type', 'procedure', 'signature', 'success', 'error'],
};

const WAMPRequestSchema = {
	id: '/WAMPRequest',
	type: 'object',
	properties: {
		data: {},
		signature: { type: 'string' },
		procedure: { type: 'string' },
		type: { type: 'string' },
	},
	required: ['type', 'procedure'],
};

const EventRequestSchema = {
	id: '/EventRequestSchema',
	type: 'object',
	properties: {
		data: {},
		procedure: { type: 'string' },
		type: { type: 'string' },
	},
	required: ['type', 'procedure'],
};

const MasterWAMPResponseSchema = {
	id: '/MasterWAMPResponse',
	type: 'object',
	properties: {
		data: {},
		error: {},
		procedure: { type: 'string' },
		signature: { type: 'string' },
		socketId: { type: 'string' },
		success: { type: 'boolean' },
		type: { type: 'string' },
		workerId: { type: 'number' },
	},
	required: ['workerId', 'socketId', 'signature', 'type', 'procedure', 'success'],
};

const MasterWAMPRequestSchema = {
	id: '/MasterWAMPRequest',
	type: 'object',
	properties: {
		data: {},
		procedure: { type: 'string' },
		signature: { type: 'string' },
		socketId: { type: 'string' },
		type: { type: 'string' },
		workerId: { type: 'number' },
	},
	required: ['workerId', 'socketId', 'type', 'procedure'],
};

const InterProcessRPCResponseSchema = {
	id: '/InterProcessRPCResponseSchema',
	type: 'object',
	properties: {
		data: {},
		error: {},
		procedure: { type: 'string' },
		signature: { type: 'string' },
		socketId: { type: 'string' },
		success: { type: 'boolean' },
		type: { type: 'string' },
		workerId: { type: 'number' },
	},
	required: ['workerId', 'socketId', 'signature', 'type', 'procedure', 'success'],
};


const InterProcessRPCRequestSchema = {
	id: '/InterProcessRPCRequestSchema',
	type: 'object',
	properties: {
		data: {},
		procedure: { type: 'string' },
		signature: { type: 'string' },
		socketId: { type: 'string' },
		type: { type: 'string' },
		workerId: { type: 'number' },
	},
	required: ['workerId', 'socketId', 'signature', 'type', 'procedure'],
};

const MasterConfigResponseSchema = {
	id: '/MasterConfigResponseSchema',
	type: 'object',
	properties: {
		registeredEvents: { type: 'array' },
		config: { type: 'object' },
		type: { type: 'string' },
	},
	required: ['type'],
};

const MasterConfigRequestSchema = {
	id: '/MasterConfigRequestSchema',
	type: 'object',
	properties: {
		type: { type: 'string' },
	},
	required: ['type'],
};


const resToReqMap = {
	[WAMPResponseSchema.id]: WAMPRequestSchema.id,
	[MasterWAMPResponseSchema.id]: WAMPRequestSchema.id,
	[InterProcessRPCResponseSchema.id]: InterProcessRPCRequestSchema.id,
	[MasterConfigResponseSchema.id]: MasterConfigRequestSchema.id,
};

const reqToResMap = {
	[WAMPRequestSchema.id]: WAMPResponseSchema.id,
	[MasterWAMPRequestSchema.id]: WAMPResponseSchema.id,
	[InterProcessRPCRequestSchema.id]: InterProcessRPCResponseSchema.id,
	[MasterConfigRequestSchema.id]: MasterConfigResponseSchema.id,
};

const isValid = (obj, schema) => v.validate(obj, schema).valid && obj.type === schema.id;

module.exports = {
	WAMPRequestSchema,
	WAMPResponseSchema,
	InterProcessRPCRequestSchema,
	InterProcessRPCResponseSchema,
	MasterWAMPResponseSchema,
	MasterWAMPRequestSchema,
	MasterConfigRequestSchema,
	MasterConfigResponseSchema,
	EventRequestSchema,
	resToReqMap,
	reqToResMap,
	isValid,
};
