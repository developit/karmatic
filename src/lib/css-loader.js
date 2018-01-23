export default function cssLoader() {
	return {
		test: /\.css$/,
		loader: 'style-loader!css-loader'
	};
}