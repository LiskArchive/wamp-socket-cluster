const path = require('path');
const webpackNodeExternals = require('webpack-node-externals');

const config = {
	entry: {
		MasterWAMPServer: './MasterWAMPServer.js',
		SlaveWAMPServer: './SlaveWAMPServer.js',
		WAMPClient: './WAMPClient.js',
		WAMPServer: './WAMPServer.js',
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
			},
		],
	},
	output: {
		path: path.join(__dirname, './dist'),
		filename: '[name].bundle.js',
		library: 'wampSocketCluster',
		libraryTarget: 'umd',
		umdNamedDefine: true,
	},
};

if (process.env.BUNDLE) {
	config.output.filename = '[name].bundle.min.js';
} else {
	config.externals = [webpackNodeExternals()];
	config.output.filename = '[name].src.min.js';
}

module.exports = config;
