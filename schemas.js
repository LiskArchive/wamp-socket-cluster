'use strict';

module.exports.WAMPResultSchema = {
	id: '/WAMPRequest',
	type: 'object',
	properties: {
		type: {type: 'string'},
		procedure: {type: 'string'},
		data: {},
		success: {type: 'boolean'}
	},
	required: ['type', 'procedure', 'success']
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