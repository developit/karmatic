module.exports = {
	mode: 'development',
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				options: {
					plugins: [
						[
							'babel-plugin-transform-rename-properties',
							{ rename: { _value: '__v' } },
						],
					],
				},
			},
		],
	},
	performance: {
		hints: false,
	},
	devtool: 'inline-source-map',
	stats: 'errors-only',
};
