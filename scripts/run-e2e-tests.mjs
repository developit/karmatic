import { execFile } from 'child_process';
import { Transform } from 'stream';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import micromatch from 'micromatch';
import { pool } from '@kristoferbaxter/async';

const IS_CI = process.env.CI === 'true';

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = (...args) => path.join(__dirname, '..', ...args);
const e2eRoot = (...args) => repoRoot('e2e-test', ...args);

const noop = () => {};
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const info = chalk.blue;
const error = chalk.red;

async function fileExists(file) {
	try {
		return (await fs.stat(file)).isFile();
	} catch (e) {}
	return false;
}

/**
 * @param {import('child_process').ChildProcess} childProcess
 * @param {(code: number, signal: string) => boolean} [isSuccess]
 */
async function onExit(childProcess, isSuccess) {
	if (!isSuccess) {
		isSuccess = (code, signal) => code === 0 || signal == 'SIGINT';
	}

	return new Promise((resolve, reject) => {
		childProcess.once('exit', (code, signal) => {
			if (isSuccess(code, signal)) {
				resolve();
			} else {
				reject(new Error('Child process exited with error code: ' + code));
			}
		});

		childProcess.once('error', (err) => {
			reject(err);
		});
	});
}

const noisyLog = /No repository field|No license field|SKIPPING OPTIONAL DEPENDENCY|You must install peer dependencies yourself/;
function createPrefixTransform(prefix) {
	let incompleteLine = '';
	return new Transform({
		transform(chunk, encoding, callback) {
			try {
				// @ts-ignore
				chunk = encoding == 'buffer' ? chunk.toString() : chunk;
				// console.log('CHUNK:', JSON.stringify(chunk));

				const lines = chunk.split('\n');

				// Prepend any incomplete parts from the previous chunk
				lines[0] = incompleteLine + lines[0];
				incompleteLine = '';

				for (let i = 0; i < lines.length; i++) {
					let line = lines[i];
					if (i == lines.length - 1) {
						// If chunk contains complete lines (i.e. ends in with a newline
						// character), then the last line in the lines array will be an
						// empty string. If chunk contains an incomplete line (i.e. does not
						// end in a newline character), then the last line will the
						// beginning of next line
						incompleteLine = line;
					} else if (line && line.match(noisyLog) == null) {
						line = `${prefix} ${line}`;
						this.push(line + '\n');
					}
				}

				callback();
			} catch (error) {
				return callback(error);
			}
		},
		flush(callback) {
			// console.log('FLUSH:', JSON.stringify(incompleteLine));
			if (incompleteLine) {
				let chunk = incompleteLine;
				incompleteLine = '';
				callback(null, chunk);
			} else {
				callback(null);
			}
		},
	});
}

async function npmInstall(cwd, prefix) {
	const name = path.basename(cwd);
	prefix = prefix || `[${name}]`;

	const args = [IS_CI ? 'ci' : 'install', '--no-fund'];
	const options = { cwd, encoding: 'utf8' };

	console.log(`${info(prefix)} Installing packages for "${name}"...`);

	const cp = execFile(npmCmd, args, options, noop);
	cp.stdout.pipe(createPrefixTransform(info(prefix))).pipe(process.stdout);
	cp.stderr.pipe(createPrefixTransform(error(prefix))).pipe(process.stderr);

	await onExit(cp);
}

/**
 * @param {string} projectPath
 * @param {string} prefix
 * @returns {Promise<() => Promise<void>>}
 */
async function setupTests(projectPath, prefix) {
	const name = path.basename(projectPath);
	const log = (...msgs) => console.log(`${info(prefix)}`, ...msgs);

	log(`Beginning E2E test at`, projectPath);
	const pkgJsonPath = path.join(projectPath, 'package.json');
	if (!(await fileExists(pkgJsonPath))) {
		prefix = error(prefix);
		console.error(
			`${prefix} Could not locate package.json for "${name}". Ensure every e2e test has a package.json defined.`
		);
		console.error(`${prefix} Expected to find one at "${pkgJsonPath}".`);
		throw new Error(`Could not locate package.json for "${name}".`);
	}

	const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));

	if (pkg.dependencies.karmatic == null) {
		log(`Updating package.json with karmatic path...`);
		const relativePath = path.relative(projectPath, repoRoot());
		pkg.dependencies.karmatic = `file:` + relativePath.replace(/\\/g, '/');
		const newContents = JSON.stringify(pkg, null, 2);
		await fs.writeFile(pkgJsonPath, newContents, 'utf8');
	}

	await npmInstall(projectPath, prefix);

	return async () => {
		const opts = { cwd: projectPath };
		let cmd, args;
		if (pkg.scripts && pkg.scripts.test) {
			cmd = npmCmd;
			args = ['test'];
			log(`Running npm test...`);
		} else {
			cmd = process.execPath;
			args = ['node_modules/karmatic/dist/cli.js', 'run'];
			log(`Running karmatic...`);
		}

		// TODO: Need to use --preserve-sym-links and --preserve-sym-links-main (or the env variables) to make symlinked karmatic require work
		const cp = execFile(cmd, args, opts);
		cp.stdout.pipe(createPrefixTransform(info(prefix))).pipe(process.stdout);
		cp.stderr.pipe(createPrefixTransform(error(prefix))).pipe(process.stderr);

		try {
			await onExit(cp);
		} catch (e) {
			console.error(error(prefix) + ` Test run failed: ${e.message}`);
		}
	};
}

/**
 * @param {string[]} args
 */
async function main(args) {
	if (args.includes('--help')) {
		console.log(
			`\nRun Karmatic E2E Tests.\n\n` +
				`Accepts globs of matching e2e tests (directory names of the e2e-test folder) as arguments.\n` +
				`Example: node ./scripts/run-e2e-tests.mjs default-*\n`
		);

		return;
	}

	process.on('exit', (code) => {
		if (code !== 0) {
			console.log(
				error('A fatal error occurred. Check the logs above for details.')
			);
		}
	});

	let matchers = args.map((glob) => micromatch.matcher(glob));
	let entries = await fs.readdir(e2eRoot(), { withFileTypes: true });
	let projects = entries
		.filter((p) => p.isDirectory)
		.map((p) => p.name)
		.filter((name) =>
			matchers.length !== 0 ? matchers.some((isMatch) => isMatch(name)) : true
		);

	const length = projects.reduce((max, name) => Math.max(max, name.length), 0);
	const getPrefix = (name) => `[${name.padEnd(length)}]`;

	console.log(
		args.length === 0
			? `Setting up all E2E tests.`
			: `Setting up selected E2E tests: ${projects.join(', ')}`
	);

	try {
		// Run npm installs serially to avoid any weird behavior since we are
		// installing using symlinks
		let runners = [];
		for (let project of projects) {
			runners.push(await setupTests(e2eRoot(project), getPrefix(project)));
		}

		console.log('Running karmatic...');
		// await pool(runners, (run) => run());
		for (let run of runners) {
			await run();
		}
	} catch (e) {
		console.error(e);
		process.exitCode = 1;
	}
}

main(process.argv.slice(2));
