const utils = {
	get: (obj, deepKeyString, defaultValue = undefined) => {
		if (typeof deepKeyString !== 'string') {
			return defaultValue;
		}
		const deepKeyArray = deepKeyString.split('.');
		let currentResult = obj;

		for (let i = 0; i < deepKeyArray.length; i += 1) {
			currentResult = currentResult[deepKeyArray[i]];
			if (currentResult === undefined) {
				return defaultValue;
			}
		}
		return currentResult;
	},
};

module.exports = utils;
