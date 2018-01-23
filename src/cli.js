#!/usr/bin/env node

import sade from 'sade';
import chalk from 'chalk';
import './lib/patch';
import karmatic from '.';
import { cleanStack } from './lib/util';

const { version } = require('../package.json');

let toArray = val => Array.isArray(val) ? val : val == null ? [] : [val];

let prog = sade('karmatic');

prog
	.version(version)
	.option('--files', 'Minimatch pattern for test files')
	.option('--headless', 'Run using Chrome Headless', true);

prog
	.command('run [...files]', '', { default: true })
	.describe('Run tests once and exit')
	.action(run);

prog
	.command('watch [...files]')
	.describe('Run tests on any change')
	.action( (str, opts) => run(str, opts, true) );

prog.parse(process.argv);

function run(str, opts, isWatch) {
	opts.watch = !!isWatch;
	opts.files = toArray(str || opts.files).concat(opts._);
	karmatic(opts)
		.then( output => {
			if (output!=null) process.stdout.write(output + '\n');
			if (!opts.watch) process.exit(0);
		})
		.catch(err => {
			if (!(typeof err.code==='number' && err.code>=0 && err.code<10)) {
				process.stderr.write(chalk.red(cleanStack(err && (err.stack || err.message) || err)) + '\n');
			}
			process.exit(err.code || 1);
		});
}
