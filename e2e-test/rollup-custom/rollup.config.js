import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

export default {
	input: 'index.js',
	output: {
		dir: 'dist',
		format: 'es',
	},
	plugins: [
		babel({
			babelHelpers: 'bundled',
			plugins: [
				[
					'babel-plugin-transform-rename-properties',
					{ rename: { _value: '__v' } },
				],
			],
		}),
		nodeResolve(),
		commonjs(),
	],
};
