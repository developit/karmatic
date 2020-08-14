import path from 'path';
import delve from 'dlv';
import { tryRequire, dedupe } from './lib/util';
import { getDefaultBabelLoader } from './lib/babel-loader';
import cssLoader from './lib/css-loader';

/**
 * @param {import('./configure').Options} options
 * @returns {boolean}
 */
export function shouldUseWebpack(options) {
	return true;
}

/**
 * @param {Object} karmaConfig
 * @param {Object} pkg
 * @param {import('./configure').Options} options
 */
export function addWebpackConfig(karmaConfig, pkg, options) {
	const WEBPACK_VERSION = String(require('webpack').version || '3.0.0');
	const WEBPACK_MAJOR = parseInt(WEBPACK_VERSION.split('.')[0], 10);

	const WEBPACK_CONFIGS = ['webpack.config.babel.js', 'webpack.config.js'];

	let cwd = process.cwd(),
		res = (file) => path.resolve(cwd, file);

	let webpackConfig = options.webpackConfig;

	if (pkg.scripts) {
		for (let i in pkg.scripts) {
			let script = pkg.scripts[i];
			if (/\bwebpack\b[^&|]*(-c|--config)\b/.test(script)) {
				let matches = script.match(
					/(?:-c|--config)\s+(?:([^\s])|(["'])(.*?)\2)/
				);
				let configFile = matches && (matches[1] || matches[2]);
				if (configFile) WEBPACK_CONFIGS.push(configFile);
			}
		}
	}

	if (!webpackConfig) {
		for (let i = WEBPACK_CONFIGS.length; i--; ) {
			webpackConfig = tryRequire(res(WEBPACK_CONFIGS[i]));
			if (webpackConfig) break;
		}
	}

	if (typeof webpackConfig === 'function') {
		webpackConfig = webpackConfig(
			{ karmatic: true },
			{ mode: 'development', karmatic: true }
		);
	}
	webpackConfig = webpackConfig || {};

	let loaders = [].concat(
		delve(webpackConfig, 'module.loaders') || [],
		delve(webpackConfig, 'module.rules') || []
	);

	function evaluateCondition(condition, filename, expected) {
		if (typeof condition === 'function') {
			return condition(filename) == expected;
		} else if (condition instanceof RegExp) {
			return condition.test(filename) == expected;
		}
		if (Array.isArray(condition)) {
			for (let i = 0; i < condition.length; i++) {
				if (evaluateCondition(condition[i], filename)) return expected;
			}
		}
		return !expected;
	}

	function getLoader(predicate) {
		if (typeof predicate === 'string') {
			let filename = predicate;
			predicate = (loader) => {
				let { test, include, exclude } = loader;
				if (exclude && evaluateCondition(exclude, filename, false))
					return false;
				if (include && !evaluateCondition(include, filename, true))
					return false;
				if (test && evaluateCondition(test, filename, true)) return true;
				return false;
			};
		}
		for (let i = 0; i < loaders.length; i++) {
			if (predicate(loaders[i])) {
				return { index: i, loader: loaders[i] };
			}
		}
		return false;
	}

	function webpackProp(name, value) {
		let configured = delve(webpackConfig, name);
		if (Array.isArray(value)) {
			return value.concat(configured || []).filter(dedupe);
		}
		return Object.assign({}, configured || {}, value);
	}

	let babelLoader = getLoader((rule) =>
		`${rule.use},${rule.loader}`.match(/\bbabel-loader\b/)
	);
	if (babelLoader) {
		if (options.coverage) {
			if (babelLoader.loader.query) {
				babelLoader.loader.query.plugins = [
					...(babelLoader.loader.query?.plugins ?? []),
					require.resolve('babel-plugin-istanbul'),
				];
			} else {
				babelLoader.loader.options = babelLoader.loader.options || {};
				babelLoader.loader.options.plugins = [
					...(babelLoader.loader.options?.plugins ?? []),
					require.resolve('babel-plugin-istanbul'),
				];
			}
		}
	} else {
		loaders.push(getDefaultBabelLoader(options));
	}

	if (!getLoader('foo.css')) {
		loaders.push(cssLoader(options));
	}

	for (let prop of Object.keys(karmaConfig.preprocessors)) {
		karmaConfig.preprocessors[prop].unshift('webpack');
	}

	karmaConfig.plugins.push(require.resolve('karma-webpack'));

	karmaConfig.webpack = {
		devtool: 'inline-source-map',
		// devtool: 'module-source-map',
		mode: webpackConfig.mode || 'development',
		module: {
			rules: loaders,
		},
		resolve: webpackProp('resolve', {
			modules: webpackProp('resolve.modules', [
				'node_modules',
				path.resolve(__dirname, '../node_modules'),
			]),
			alias: webpackProp('resolve.alias', {
				[pkg.name]: res('.'),
				src: res('src'),
			}),
		}),
		resolveLoader: webpackProp('resolveLoader', {
			modules: webpackProp('resolveLoader.modules', [
				'node_modules',
				path.resolve(__dirname, '../node_modules'),
			]),
			alias: webpackProp('resolveLoader.alias', {
				[pkg.name]: res('.'),
				src: res('src'),
			}),
		}),
		plugins: (webpackConfig.plugins || []).filter((plugin) => {
			let name = plugin && plugin.constructor.name;
			return /^\s*(UglifyJS|HTML|ExtractText|BabelMinify)(.*Webpack)?Plugin\s*$/gi.test(
				name
			);
		}),
		node: webpackProp('node', {}),
		performance: {
			hints: false,
		},
	};

	karmaConfig.webpackMiddleware = {
		noInfo: true,
		logLevel: 'error',
		stats: 'errors-only',
	};

	if (WEBPACK_MAJOR < 4) {
		delete karmaConfig.webpack.mode;
		let { rules } = karmaConfig.webpack.module;
		delete karmaConfig.webpack.module.rules;
		karmaConfig.webpack.module.loaders = rules;
	}

	return karmaConfig;
}
