module.exports = (api) => {
	api.cache(true);

	return {
		plugins: [
			['@babel/plugin-transform-react-jsx', { pragma: 'createElement' }],
		],
	};
};
