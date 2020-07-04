import path from 'path';
import puppeteer from 'puppeteer';
import chalk from 'chalk';
import delve from 'dlv';
import { tryRequire, dedupe, cleanStack, readFile, readDir } from './lib/util';
import babelLoader from './lib/babel-loader';
import cssLoader from './lib/css-loader';
// import minimatch from 'minimatch';

const WEBPACK_VERSION = String(require('webpack').version || '3.0.0');
const WEBPACK_MAJOR = parseInt(WEBPACK_VERSION.split('.')[0], 10);

/**
 * @param {Object} options
 * @param {Array} options.files - Test files to run
 * @param {Array} [options.browsers] - Custom list of browsers to run in
 * @param {Boolean} [options.headless=false] - Run in Headless Chrome?
 * @param {Boolean} [options.watch=false] - Start a continuous test server and retest when files change
 * @param {Boolean} [options.coverage=false] - Instrument and collect code coverage statistics
 * @param {Object} [options.webpackConfig] - Custom webpack configuration
 * @param {Boolean} [options.downlevel=false] - Downlevel/transpile syntax to ES5
 * @param {string} [options.chromeDataDir] - Use a custom Chrome profile directory
 */
export default function configure(options) {
	let cwd = process.cwd(),
		res = (file) => path.resolve(cwd, file);

	let files = options.files.filter(Boolean);
	if (!files.length) files = ['**/{*.test.js,*_test.js}'];

	process.env.CHROME_BIN = puppeteer.executablePath();

	let gitignore = (readFile(path.resolve(cwd, '.gitignore')) || '')
		.replace(/(^\s*|\s*$|#.*$)/g, '')
		.split('\n')
		.filter(Boolean);
	let repoRoot = (readDir(cwd) || []).filter(
		(c) => c[0] !== '.' && c !== 'node_modules' && gitignore.indexOf(c) === -1
	);
	let rootFiles = '{' + repoRoot.join(',') + '}';

	const PLUGINS = [
		'karma-chrome-launcher',
		'karma-jasmine',
		'karma-spec-reporter',
		'karma-sourcemap-loader',
		'karma-webpack',
	].concat(options.coverage ? 'karma-coverage' : []);

	const preprocessors = [
		'webpack',
		'sourcemap',
		options.coverage && 'coverage',
	].filter(Boolean);

	// Custom launchers to be injected:
	const launchers = {};
	let useSauceLabs = false;

	let browsers;
	if (options.browsers) {
		browsers = options.browsers.map((browser) => {
			if (/^chrome([ :-]?headless)?$/i.test(browser)) {
				return `KarmaticChrome${/headless/i.test(browser) ? 'Headless' : ''}`;
			}
			if (/^firefox$/i.test(browser)) {
				PLUGINS.push('karma-firefox-launcher');
				return 'Firefox';
			}
			if (/^sauce-/.test(browser)) {
				if (!useSauceLabs) {
					useSauceLabs = true;
					PLUGINS.push('karma-sauce-launcher');
				}
				const parts = browser.toLowerCase().split('-');
				const name = parts.join('_');
				launchers[name] = {
					base: 'SauceLabs',
					browserName: parts[1]
						.replace(/^(msie|ie|internet ?explorer)$/i, 'Internet Explorer')
						.replace(/^(ms|microsoft|)edge$/i, 'MicrosoftEdge'),
					version: parts[2] || undefined,
					platform: parts[3]
						? parts[3]
								.replace(/^win(dows)?[ -]+/gi, 'Windows ')
								.replace(/^(macos|mac ?os ?x|os ?x)[ -]+/gi, 'OS X ')
						: undefined,
				};
				return name;
			}
			return browser;
		});
	} else {
		browsers = [
			options.headless === false ? 'KarmaticChrome' : 'KarmaticChromeHeadless',
		];
	}

	if (useSauceLabs) {
		let missing = ['SAUCE_USERNAME', 'SAUCE_ACCESS_KEY'].filter(
			(x) => !process.env[x]
		)[0];
		if (missing) {
			throw '\n' +
				chalk.bold.bgRed.white('Error:') +
				' Missing SauceLabs auth configuration.' +
				'\n  ' +
				chalk.white(
					`A SauceLabs browser was requested, but no ${chalk.magentaBright(
						missing
					)} environment variable provided.`
				) +
				'\n  ' +
				chalk.white('Try prepending it to your test command:') +
				'  ' +
				chalk.greenBright(missing + '=... npm test') +
				'\n';
		}
	}

	const WEBPACK_CONFIGS = ['webpack.config.babel.js', 'webpack.config.js'];

	let webpackConfig = options.webpackConfig;

	let pkg = tryRequire(res('package.json'));

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

	const chromeDataDir = options.chromeDataDir
		? path.resolve(cwd, options.chromeDataDir)
		: null;

	const flags = ['--no-sandbox'];

	let generatedConfig = {
		basePath: cwd,
		plugins: PLUGINS.map((req) => require.resolve(req)),
		frameworks: ['jasmine'],
		reporters: [options.watch ? 'min' : 'spec'].concat(
			options.coverage ? 'coverage' : [],
			useSauceLabs ? 'saucelabs' : []
		),
		browsers,
		sauceLabs: {
			testName: (pkg && pkg.name) || undefined,
		},

		customLaunchers: Object.assign(
			{
				KarmaticChrome: {
					base: 'Chrome',
					chromeDataDir,
					flags,
				},
				KarmaticChromeHeadless: {
					base: 'ChromeHeadless',
					chromeDataDir,
					flags,
				},
			},
			launchers
		),

		coverageReporter: {
			reporters: [
				{ type: 'text-summary' },
				{ type: 'html' },
				{ type: 'lcovonly', subdir: '.', file: 'lcov.info' },
			],
		},

		formatError(msg) {
			try {
				msg = JSON.parse(msg).message;
			} catch (e) {}
			return cleanStack(msg);
		},

		logLevel: 'ERROR',

		loggers: [
			{
				type: path.resolve(__dirname, 'appender.js'),
			},
		],

		files: [
			// Inject Jest matchers:
			{
				pattern: path.resolve(
					__dirname,
					'../node_modules/expect/build-es5/index.js'
				),
				watched: false,
				included: true,
				served: true,
			},
		].concat(
			...files.map((pattern) => {
				// Expand '**/xx' patterns but exempt node_modules and gitignored directories
				let matches = pattern.match(/^\*\*\/(.+)$/);
				if (!matches)
					return { pattern, watched: true, served: true, included: true };
				return [
					{
						pattern: rootFiles + '/' + matches[0],
						watched: true,
						served: true,
						included: true,
					},
					{ pattern: matches[1], watched: true, served: true, included: true },
				];
			})
		),

		preprocessors: {
			[rootFiles + '/**/*']: preprocessors,
			[rootFiles]: preprocessors,
		},

		webpack: {
			devtool: 'inline-source-map',
			// devtool: 'module-source-map',
			mode: webpackConfig.mode || 'development',
			module: {
				// @TODO check webpack version and use loaders VS rules as the key here appropriately:
				rules: loaders
					.concat(
						!getLoader((rule) =>
							`${rule.use},${rule.loader}`.match(/\bbabel-loader\b/)
						)
							? babelLoader(options)
							: false /*({
						test: /\.[tj]sx?$/,
						// include: files.map(f => minimatch.filter(f, { matchBase: true })),
						exclude: /node_modules/,
						enforce: 'pre',
						loader: require.resolve('istanbul-instrumenter-loader')
					})*/,
						!getLoader('foo.css') && cssLoader(options)
					)
					.filter(Boolean),
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
		},

		webpackMiddleware: {
			noInfo: true,
			logLevel: 'error',
			stats: 'errors-only',
		},

		colors: true,

		client: {
			captureConsole: true,

			jasmine: {
				random: false,
			},
		},
	};

	if (WEBPACK_MAJOR < 4) {
		delete generatedConfig.webpack.mode;
		let { rules } = generatedConfig.webpack.module;
		delete generatedConfig.webpack.module.rules;
		generatedConfig.webpack.module.loaders = rules;
	}

	return generatedConfig;
}
