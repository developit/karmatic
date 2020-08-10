import chalk from 'chalk';
import { babelConfig } from './lib/babel';
import { res, tryRequire } from './lib/util';

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
			commonjs(),
			nodeResolve(),
			babel({
				babelHelpers: 'bundled',
				...babelConfig(options),
			}),
		].filter(Boolean),
	};
}

/**
 * @param {Object} pkg
 * @param {import('./configure').Options} options
 */
function getRollupConfig(pkg, options) {
	const ROLLUP_CONFIGS = ['rollup.config.js'];

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
			// TODO: Breaks if rollup.config.js uses ES Modules... :(
			rollupConfig = tryRequire(res(ROLLUP_CONFIGS[i]));
			if (rollupConfig) break;
		}
	}

	if (typeof rollupConfig === 'function') {
		rollupConfig = rollupConfig({ karmatic: true });
	}

	if (Array.isArray(rollupConfig)) {
		rollupConfig = rollupConfig[0];
	} else if (rollupConfig && rollupConfig.then) {
		rollupConfig = null;
		console.warn(
			chalk.yellow(
				`Karmatic does not currently support asynchronous rollup configs. Using a default config instead.`
			)
		);
	}

	return rollupConfig || getDefaultConfig(options);
}

/**
 * @param {import('./configure').Options} options
 * @returns {boolean}
 */
export function shouldUseRollup(options) {
	let shouldUse = true;
	try {
		require('rollup');
	} catch (error) {
		shouldUse = false;
	}

	return shouldUse;
}

/**
 * @param {Object} karmaConfig
 * @param {Object} pkg
 * @param {import('./configure').Options} options
 */
export function addRollupConfig(karmaConfig, pkg, options) {
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

	karmaConfig.rollupPreprocessor = getRollupConfig(pkg, options);
}
