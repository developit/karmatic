export default function cssLoader(options) {
	return {
		test: /\.css$/,
		use: ['style-loader', 'css-loader'],
	};
}
