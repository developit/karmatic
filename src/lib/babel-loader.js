export function getCoverageBabelLoader() {
	return {
		test: /\.jsx?$/,
		exclude: /node_modules/,
		loader: require.resolve('babel-loader'),
		query: {
			plugins: [require.resolve('babel-plugin-istanbul')],
		},
	};
}

export function getDefaultBabelLoader(options) {
	return {
		test: /\.jsx?$/,
		exclude: /node_modules/,
		loader: require.resolve('babel-loader'),
		query: {
			presets: [
				[
					require.resolve('@babel/preset-env'),
					{
						targets: {
							browsers: [
								'last 2 Chrome versions',
								'last 2 Firefox versions',
								(options.downlevel ||
									(options.browsers &&
										String(options.browsers).match(
											/(\b|ms|microsoft)(ie|internet.explorer|edge)/gi
										))) &&
									'ie>=9',
							].filter(Boolean),
						},
						corejs: 3,
						useBuiltIns: 'usage',
						modules: false,
						loose: true,
					},
				],
			],
			plugins: [
				[
					require.resolve('@babel/plugin-transform-react-jsx'),
					{
						pragma: options.pragma || 'h',
					},
				],
			].concat(
				options.coverage ? [require.resolve('babel-plugin-istanbul')] : []
			),
		},
	};
}
