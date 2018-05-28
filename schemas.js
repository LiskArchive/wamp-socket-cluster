const Validator = require('jsonschema').Validator;

const v = new Validator();

const RPCResponseSchema = {
	id: '/RPCResponse',
	type: 'object',
	properties: {
		type: { type: 'string' },
		data: {},
	},
	required: ['type', 'data'],
};

const RPCRequestSchema = {
	id: '/RPCRequest',
	type: 'object',
	properties: {
		type: { type: 'string' },
		procedure: { type: 'string' },
		data: {},
	},
	required: ['type', 'procedure'],
};

const EventRequestSchema = {
	id: '/EventRequestSchema',
	type: 'object',
	properties: {
		type: { type: 'string' },
		procedure: { type: 'string' },
		data: {},
	},
	required: ['type', 'procedure'],
};

const MasterRPCRequestSchema = {
	id: '/MasterRPCRequest',
	type: 'object',
	properties: {
		type: { type: 'string' },
		procedure: { type: 'string' },
		data: {},
	},
	required: ['type', 'procedure'],
};

const InterProcessRPCRequestSchema = {
	id: '/InterProcessRPCRequestSchema',
	type: 'object',
	properties: {
		type: { type: 'string' },
		procedure: { type: 'string' },
		data: {},
	},
	required: ['type', 'procedure'],
};

const MasterConfigRequestSchema = {
	id: '/MasterConfigRequestSchema',
	type: 'object',
	properties: {
		type: { type: 'string' },
		registeredEvents: { type: 'array' },
		config: { type: 'object' },
	},
	required: ['type', 'registeredEvents', 'config'],
};


const resToReqMap = {
	[RPCResponseSchema.id]: RPCRequestSchema.id,
};

const reqToResMap = {
	[RPCRequestSchema.id]: RPCResponseSchema.id,
	[MasterRPCRequestSchema.id]: RPCResponseSchema.id,
};

const isValid = (obj, schema) => v.validate(obj, schema).valid && obj.type === schema.id;

module.exports = {
	EventRequestSchema,
	RPCRequestSchema,
	RPCResponseSchema,
	InterProcessRPCRequestSchema,
	MasterRPCRequestSchema,
	MasterConfigRequestSchema,
	resToReqMap,
	reqToResMap,
	isValid,
};
