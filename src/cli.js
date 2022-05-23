#!/usr/bin/env node

import sade from 'sade';
import chalk from 'chalk';
import './lib/patch';
import karmatic from '.';
import { cleanStack } from './lib/util';

// @ts-ignore
const { version } = require('../package.json');

let toArray = (val) =>
	typeof val === 'string'
		? val.split(/\s*,\s*/)
		: val == null
		? []
		: [].concat(val);

let prog = sade('karmatic');

prog
	.version(version)
	.option('--files', 'Minimatch pattern for test files')
	.option('--headless', 'Run using Chrome Headless', true)
	.option('--coverage', 'Report code coverage of tests', true)
	.option('--downlevel', 'Downlevel syntax to ES5')
	.option('--webpack', 'Force Webpack usage (--no-webpack disables detection)')
	.option('--chromeDataDir', 'Save Chrome preferences');

prog
	.command('run [...files]', '', { default: true })
	.describe('Run tests once and exit')
	.option('--watch', 'Enable watch mode (alias: karmatic watch)', false)
	.action(run);

prog
	.command('watch [...files]')
	.describe('Run tests on any change')
	.action((str, opts) => run(str, opts, true));

prog
	.command('debug [...files]')
	.describe('Open a headful Puppeteer instance for debugging your tests')
	.option('--headless', 'Run using Chrome Headless', false) // Override default to false
	.option('--browsers', 'Run in specific browsers', null)
	.option('--coverage', 'Report code coverage of tests', false) // Override default to false
	.action((str, opts) => run(str, opts, true));

prog.parse(process.argv);

function run(str, opts, isWatch) {
	opts.watch = opts.watch === true || isWatch === true;
	opts.files = toArray(str || opts.files).concat(opts._);
	const b = opts.browsers || opts.browser;
	opts.browsers = b ? toArray(b) : null;

	karmatic(opts)
		.then((output) => {
			if (output != null) process.stdout.write(output + '\n');
			if (!opts.watch) process.exit(0);
		})
		.catch((err) => {
			if (!(typeof err.code === 'number' && err.code >= 0 && err.code < 10)) {
				process.stderr.write(
					chalk.red(cleanStack((err && (err.stack || err.message)) || err)) +
						'\n'
				);
			}
			process.exit(typeof err.code == 'number' ? err.code : 1);
		});
}
