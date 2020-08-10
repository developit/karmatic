import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sucrase from '@rollup/plugin-sucrase';

export default {
	input: 'index.js',
	output: {
		dir: 'dist',
		format: 'es',
	},
	plugins: [
		nodeResolve(),
		sucrase({
			transforms: ['jsx'],
			jsxPragma: 'createElement',
			production: true,
		}),
		commonjs(),
	],
};
