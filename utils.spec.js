/* eslint-env node, mocha */
const { expect } = require('./testSetup.spec');

const utils = require('./utils');

describe('utils', () => {
	describe('get', () => {
		let validPath;
		let validObject;
		let validDefaultValue;

		let getResult;

		before(() => {
			validPath = '';
			validObject = {};
			validDefaultValue = undefined;
		});

		beforeEach(() => {
			getResult = utils.get(validObject, validPath, validDefaultValue);
		});

		describe('when path is not a string', () => {
			describe('when path is an object', () => {
				before(() => {
					validPath = {};
				});

				it('should return undefined', () => {
					expect(getResult).to.be.undefined();
				});
			});

			describe('when path is an array', () => {
				before(() => {
					validPath = [];
				});

				it('should return undefined', () => {
					expect(getResult).to.be.undefined();
				});
			});

			describe('when path is a number', () => {
				before(() => {
					const validNumber = 1;
					validPath = validNumber;
				});

				it('should return undefined', () => {
					expect(getResult).to.be.undefined();
				});
			});

			describe('when path is null', () => {
				before(() => {
					validPath = null;
				});

				it('should return undefined', () => {
					expect(getResult).to.be.undefined();
				});
			});

			describe('when path is undefined', () => {
				before(() => {
					validPath = undefined;
				});

				it('should return undefined', () => {
					expect(getResult).to.be.undefined();
				});
			});
		});

		describe('when path is a string', () => {
			describe('and is empty', () => {
				before(() => {
					validPath = '';
				});

				it('should return undefined', () => {
					expect(getResult).to.be.undefined();
				});
			});

			describe('when accessing nested object', () => {
				before(() => {
					validObject = {
						a: {
							b: {
								c: {
									d: 'abcd',
								},
							},
						},
					};
				});

				describe('when accessing property does not exist', () => {
					before(() => {
						validPath = 'A.B.C.D';
					});

					it('should return undefined', () => {
						expect(getResult).to.be.undefined();
					});

					describe('when defaultValue = false', () => {
						before(() => {
							validDefaultValue = false;
						});

						it('should return undefined', () => {
							expect(getResult).to.be.false();
						});
					});
				});

				describe('when accessing property exists', () => {
					describe('and points to the middle-path value', () => {
						before(() => {
							validPath = 'a.b';
						});

						it('should return {c: {d: "abcd"}}}', () => {
							expect(getResult).to.eql({
								c: {
									d: 'abcd',
								},
							});
						});
					});

					describe('and points to the final value', () => {
						before(() => {
							validPath = 'a.b.c.d';
						});

						it('should return "abcd"', () => {
							expect(getResult).to.equal('abcd');
						});
					});
				});
			});
		});
	});
});
