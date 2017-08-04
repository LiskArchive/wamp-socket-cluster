'use strict';

const chai = require('chai');
const sinon = require('sinon');
const WAMPServer = require('./WAMPServer.js');
const expect = chai.expect;

describe('WAMPServer', function () {

	describe('constructor', function () {

		it('create wampServer with endpoints field', function () {
			const wampServer = new WAMPServer();
			expect(wampServer).to.have.deep.property('endpoints.rpc').to.be.a('object').and.to.be.empty;
			expect(wampServer).to.have.deep.property('endpoints.event').to.be.a('object').and.to.be.empty;
		});

	});

	describe('upgradeToWAMP', function () {

		it('should add "raw" listener to passed socket', function () {
			let socket = {
				on: sinon.spy()
			};
			socket = new WAMPServer().upgradeToWAMP(socket);
			expect(socket.on.calledOnce).to.be.ok;
			expect(socket.on.calledWith('raw')).to.be.ok;
		});

	});


	describe('registerRPCEndpoints', function () {

		it('should add new endpoint to rpc procedures', function () {
			const wampServer = new WAMPServer();
			wampServer.registerRPCEndpoints({endpointA: cb => cb()});
			expect(wampServer.endpoints.rpc).to.have.property('endpointA');
		});

		it('should add new endpoints to rpc procedures', function () {
			const wampServer = new WAMPServer();
			wampServer.registerRPCEndpoints({
				endpointA: cb => cb(),
				endpointB: cb => cb(),
			});
			expect(wampServer.endpoints.rpc).to.have.property('endpointA');
			expect(wampServer.endpoints.rpc).to.have.property('endpointB');
		});
	});

	describe('reassignRPCEndpoints', function () {

		it('should replace old endpoints with the new', function () {
			const wampServer = new WAMPServer();
			wampServer.registerRPCEndpoints({endpointA: cb => cb()});
			expect(wampServer.endpoints.rpc).to.have.property('endpointA');
			wampServer.reassignRPCEndpoints({endpointB: cb => cb()});
			expect(wampServer.endpoints.rpc).not.to.have.property('endpointA');
			expect(wampServer.endpoints.rpc).to.have.property('endpointB');
		});
	});

	describe('registerEventEndpoints', function () {

		it('should add new endpoint to event procedures', function () {
			const wampServer = new WAMPServer();
			wampServer.registerEventEndpoints({endpointA: cb => cb()});
			expect(wampServer.endpoints.event).to.have.property('endpointA');
		});

		it('should add new endpoints to event procedures', function () {
			const wampServer = new WAMPServer();
			wampServer.registerEventEndpoints({
				endpointA: cb => cb(),
				endpointB: cb => cb(),
			});
			expect(wampServer.endpoints.event).to.have.property('endpointA');
			expect(wampServer.endpoints.event).to.have.property('endpointB');
		});
	});

	describe('reassignEventEndpoints', function () {

		it('should replace old endpoints with the new', function () {
			const wampServer = new WAMPServer();
			wampServer.registerEventEndpoints({endpointA: cb => cb()});
			expect(wampServer.endpoints.event).to.have.property('endpointA');
			wampServer.reassignEventEndpoints({endpointB: cb => cb()});
			expect(wampServer.endpoints.event).not.to.have.property('endpointA');
			expect(wampServer.endpoints.event).to.have.property('endpointB');
		});
	});

	describe('processWAMPRequest', function () {

		it('should throw an error if no while attempt to invoke not registered procedure', function () {
			const socket = {
				on: sinon.spy(),
				send: sinon.spy()
			};
			const wampServer = new WAMPServer();
			wampServer.upgradeToWAMP(socket);
			try {
				wampServer.processWAMPRequest({procedure: 'not-registered-procedure'}, socket);
			} catch (ex) {
				expect(ex.toString()).equal(new Error('Attempt to call unregistered procedure not-registered-procedure').toString());
			}
		});

		it('should invoke procedure when proper request passed', function () {
			const socket = {
				on: sinon.spy(),
				send: sinon.spy()
			};

			const endpoint = {procedureA: sinon.spy()};
			const wampServer = new WAMPServer();
			wampServer.upgradeToWAMP(socket);
			wampServer.registerRPCEndpoints(endpoint);
			wampServer.processWAMPRequest({procedure: 'procedureA', data: 'valueA'}, socket);
			expect(endpoint.procedureA.calledOnce).to.be.ok;
			expect(endpoint.procedureA.calledWith('valueA')).to.be.ok;
		});
	});
});
