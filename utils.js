const utils = {
	get: (obj, deepKeyString, defaultValue = undefined) => {
		if (typeof deepKeyString !== 'string') {
			return defaultValue;
		}
		const deepKeyArray = deepKeyString.split('.');
		let currentResult = obj;
		for (const key of deepKeyArray) {
			currentResult = currentResult[key];
			if (currentResult === undefined) {
				return defaultValue;
			}
		}
		return currentResult;
	}
};

module.exports = utils;
