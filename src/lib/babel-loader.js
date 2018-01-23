export default function babelLoader(options) {
	return {
		test: /\.jsx?$/,
		exclude: /node_modules/,
		loader: 'babel-loader',
		query: {
			presets: [
				[require.resolve('babel-preset-env'), {
					targets: {
						browsers: 'last 2 Chrome versions'
					},
					modules: false,
					loose: true
				}],
				require.resolve('babel-preset-stage-0')
			],
			plugins: [
				[require.resolve('babel-plugin-transform-object-rest-spread')],
				[require.resolve('babel-plugin-transform-react-jsx'), { pragma: options.pragma || 'h' }]
			]
		}
	};
}
