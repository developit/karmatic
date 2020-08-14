import { babelConfig } from './lib/babel';
import { res, fileExists } from './lib/util';

/**
 * @param {import('./configure').Options} options
 */
function getDefaultConfig(options) {
	let babel = require('@rollup/plugin-babel').default;
	let commonjs = require('@rollup/plugin-commonjs');
	let nodeResolve = require('@rollup/plugin-node-resolve').default;

	return {
		output: {
			format: 'iife',
			name: `KarmaticTests`,
			sourcemap: 'inline',
		},
		plugins: [
			babel({
				babelHelpers: 'bundled',
				...babelConfig(options),
			}),
			nodeResolve(),
			commonjs(),
		],
	};
}

/**
 * @param {Object} pkg
 * @param {import('./configure').Options} options
 */
async function getRollupConfig(pkg, options) {
	const ROLLUP_CONFIGS = [
		'rollup.config.mjs',
		'rollup.config.cjs',
		'rollup.config.js',
	];

	let rollupConfig = options.rollupConfig;

	if (pkg.scripts) {
		for (let i in pkg.scripts) {
			let script = pkg.scripts[i];
			if (/\brollup\b[^&|]*(-c|--config)\b/.test(script)) {
				let matches = script.match(
					/(?:-c|--config)\s+(?:([^\s])|(["'])(.*?)\2)/
				);
				let configFile = matches && (matches[1] || matches[2]);
				if (configFile) ROLLUP_CONFIGS.push(configFile);
			}
		}
	}

	if (!rollupConfig) {
		for (let i = ROLLUP_CONFIGS.length; i--; ) {
			let possiblePath = res(ROLLUP_CONFIGS[i]);
			if (fileExists(possiblePath)) {
				// Require Rollup 2.3.0 for this export: https://github.com/rollup/rollup/blob/master/CHANGELOG.md#230
				let loadConfigFile = require('rollup/dist/loadConfigFile');
				let rollupConfigResult = await loadConfigFile(possiblePath);
				rollupConfigResult.warnings.flush();

				if (rollupConfigResult.options.length > 1) {
					console.error(
						'Rollup config returns an array configs. Using the first one for tests'
					);
				}

				rollupConfig = rollupConfigResult.options[0];
				break;
			}
		}
	}

	if (rollupConfig) {
		let babel = require('@rollup/plugin-babel').default;
		rollupConfig.plugins = (rollupConfig.plugins || []).concat([
			babel({
				babelHelpers: 'bundled',
				plugins: [require.resolve('babel-plugin-istanbul')],
			}),
		]);

		return rollupConfig;
	}

	return getDefaultConfig(options);
}

/**
 * @param {Object} karmaConfig
 * @param {Object} pkg
 * @param {import('./configure').Options} options
 */
export async function addRollupConfig(karmaConfig, pkg, options) {
	// From karma-rollup-preprocessor readme:
	// Make sure to disable Karma’s file watcher
	// because the preprocessor will use its own.
	for (let i = 0; i < karmaConfig.files; i++) {
		let entry = karmaConfig.files[i];
		if (typeof entry == 'string') {
			karmaConfig.files[i] = { pattern: entry, watched: false };
		} else {
			karmaConfig.files[i].watched = false;
		}
	}

	for (let prop of Object.keys(karmaConfig.preprocessors)) {
		karmaConfig.preprocessors[prop].unshift('rollup');
	}

	karmaConfig.plugins.push(require.resolve('karma-rollup-preprocessor'));

	karmaConfig.rollupPreprocessor = await getRollupConfig(pkg, options);
}
