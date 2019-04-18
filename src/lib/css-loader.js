export default function cssLoader(options) {
	return {
		test: /\.css$/,
		loader: 'style-loader!css-loader'
	};
}