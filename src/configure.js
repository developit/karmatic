import path from 'path';
import puppeteer from 'puppeteer';
import delve from 'dlv';
import { moduleDir, tryRequire, dedupe, cleanStack, readFile, readDir } from './lib/util';
import babelLoader from './lib/babel-loader';
import cssLoader from './lib/css-loader';

export default function configure(options) {
	let cwd = process.cwd(),
		res = file => path.resolve(cwd, file);

	let files = options.files.filter(Boolean);
	if (!files.length) files = ['**/{*.test.js,*_test.js}'];

	process.env.CHROME_BIN = puppeteer.executablePath();

	let gitignore = (readFile(path.resolve(cwd, '.gitignore'), 'utf8') || '').replace(/(^\s*|\s*$|#.*$)/g, '').split('\n').filter(Boolean);
	let repoRoot = (readDir(cwd) || []).filter( c => c[0]!=='.' && c!=='node_modules' && gitignore.indexOf(c)===-1 );
	let rootFiles = '{' + repoRoot.join(',') + '}';

	const PLUGINS = [
		'karma-chrome-launcher',
		'karma-jasmine',
		'karma-spec-reporter',
		'karma-sourcemap-loader',
		'karma-webpack'
	];

	const WEBPACK_CONFIGS = [
		'webpack.config.babel.js',
		'webpack.config.js'
	];

	let webpackConfig = options.webpackConfig;

	let pkg = tryRequire(res('package.json'));

	if (pkg.scripts) {
		for (let i in pkg.scripts) {
			let script = pkg.scripts[i];
			if (/\bwebpack\b[^&|]*(-c|--config)\b/.test(script)) {
				let matches = script.match(/(?:-c|--config)\s+(?:([^\s])|(["'])(.*?)\2)/);
				let configFile = matches && (matches[1] || matches[2]);
				if (configFile) WEBPACK_CONFIGS.push(configFile);
			}
		}
	}

	if (!webpackConfig) {
		for (let i=WEBPACK_CONFIGS.length; i--; ) {
			webpackConfig = tryRequire(res(WEBPACK_CONFIGS[i]));
			if (webpackConfig) break;
		}
	}

	if (typeof webpackConfig==='function') {
		webpackConfig = webpackConfig({ karmatic: true }, { mode: 'development', karmatic: true });
	}
	webpackConfig = webpackConfig || {};

	let loaders = [].concat(delve(webpackConfig, 'module.loaders') || [], delve(webpackConfig, 'module.rules') || []);

	function evaluateCondition(condition, filename, expected) {
		if (typeof condition==='function') {
			return condition(filename)==expected;
		}
		else if (condition instanceof RegExp) {
			return condition.test(filename)==expected;
		}
		if (Array.isArray(condition)) {
			for (let i=0; i<condition.length; i++) {
				if (evaluateCondition(condition[i], filename)) return expected;
			}
		}
		return !expected;
	}

	function getLoader(predicate) {
		if (typeof predicate==='string') {
			let filename = predicate;
			predicate = loader => {
				let { test, include, exclude } = loader;
				if (exclude && evaluateCondition(exclude, filename, false)) return false;
				if (include && !evaluateCondition(include, filename, true)) return false;
				if (test && evaluateCondition(test, filename, true)) return true;
				return false;
			};
		}
		for (let i=0; i<loaders.length; i++) {
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

	return {
		basePath: cwd,
		plugins: PLUGINS.map(require.resolve),
		frameworks: ['jasmine'],
		reporters: ['spec'],
		browsers: [options.headless===false ? 'KarmaticChrome' : 'KarmaticChromeHeadless'],

		customLaunchers: {
			KarmaticChrome: {
				base: 'Chrome'
			},
			KarmaticChromeHeadless: {
				base: 'ChromeHeadless',
				flags: ['--no-sandbox']
			}
		},

		formatError(msg) {
			try {
				msg = JSON.parse(msg).message;
			}
			catch (e) {}
			return cleanStack(msg);
		},

		logLevel: 'ERROR',

		loggers: [{
			type: path.resolve(__dirname, 'appender.js')
		}],

		files: [
			{ pattern: moduleDir('babel-polyfill')+'/dist/polyfill.js', watched: false, included: true, served: true }
		].concat( ...files.map( pattern => {
			// Expand '**/xx' patterns but exempt node_modules and gitignored directories
			let matches = pattern.match(/^\*\*\/(.+)$/);
			if (!matches) return { pattern, watched: true, served: true, included: true };
			return [
				{ pattern: rootFiles + '/' + matches[0], watched: true, served: true, included: true },
				{ pattern: matches[1], watched: true, served: true, included: true }
			];
		}) ),

		preprocessors: {
			[rootFiles+'/**/*']: ['webpack'],
			[rootFiles]: ['webpack']
		},

		webpack: {
			devtool: 'cheap-module-eval-source-map',
			mode: 'development',
			module: {
				loaders: loaders.concat(
					!getLoader( rule => `${rule.use},${rule.loader}`.match(/\bbabel-loader\b/) ) && babelLoader(options),
					!getLoader('foo.css') && cssLoader(options)
				).filter(Boolean)
			},
			resolve: webpackProp('resolve', {
				modules: webpackProp('resolve.modules', [
					'node_modules',
					path.resolve(__dirname, '../node_modules')
				]),
				alias: webpackProp('resolve.alias', {
					[pkg.name]: res('.'),
					src: res('src')
				})
			}),
			resolveLoader: webpackProp('resolveLoader', {
				modules: webpackProp('resolveLoader.modules', [
					'node_modules',
					path.resolve(__dirname, '../node_modules')
				]),
				alias: webpackProp('resolveLoader.alias', {
					[pkg.name]: res('.'),
					src: res('src')
				})
			}),
			plugins: (webpackConfig.plugins || []).filter( plugin => {
				let name = plugin && plugin.constructor.name;
				return /^\s*(UglifyJS|HTML|ExtractText|BabelMinify)(.*Webpack)?Plugin\s*$/gi.test(name);
			}),
			node: webpackProp('node', {})
		},

		webpackMiddleware: {
			noInfo: true
		},

		colors: true,

		client: {
			captureConsole: true,

			jasmine: {
				random: false
			}
		}
	};
}
