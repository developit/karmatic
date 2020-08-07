import path from 'path';
import puppeteer from 'puppeteer';
import chalk from 'chalk';
import { tryRequire, cleanStack, readFile, readDir } from './lib/util';
import { shouldUseWebpack, addWebpackConfig } from './webpack';
import { shouldUseRollup, addRollupConfig } from './rollup';
// import minimatch from 'minimatch';

/**
 * @typedef Options
 * @property {Array} files - Test files to run
 * @property {Array} [browsers] - Custom list of browsers to run in
 * @property {Boolean} [headless=false] - Run in Headless Chrome?
 * @property {Boolean} [watch=false] - Start a continuous test server and retest when files change
 * @property {Boolean} [coverage=false] - Instrument and collect code coverage statistics
 * @property {Object} [webpackConfig] - Custom webpack configuration
 * @property {Object} [rollupConfig] - Custom rollup configuration
 * @property {string} [pragma] - JSX pragma to compile JSX with
 * @property {Boolean} [downlevel=false] - Downlevel/transpile syntax to ES5
 * @property {string} [chromeDataDir] - Use a custom Chrome profile directory
 *
 * @param {Options} options
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
		'karma-min-reporter',
		'karma-sourcemap-loader',
	].concat(options.coverage ? 'karma-coverage' : []);

	const preprocessors = ['sourcemap'];

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

	let pkg = tryRequire(res('package.json'));

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

		colors: true,

		client: {
			captureConsole: true,

			jasmine: {
				random: false,
			},
		},
	};

	if (shouldUseWebpack(options)) {
		addWebpackConfig(generatedConfig, pkg, options);
	} else if (shouldUseRollup(options)) {
		addRollupConfig(generatedConfig, pkg, options);
	} else {
		console.error(
			chalk.red(
				`Could not load "webpack" or "rollup". Install one of them and we're good to go :)`
			)
		);

		process.exit(1);
	}

	return generatedConfig;
}
