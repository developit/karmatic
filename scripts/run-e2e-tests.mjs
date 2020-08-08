import { execFile } from 'child_process';
import { tmpdir } from 'os';
import { Transform } from 'stream';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import chalk from 'chalk';
// import { pool } from '@kristoferbaxter/async';

const IS_CI = process.env.CI === 'true';

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = (...args) => path.join(__dirname, '..', ...args);
const tmpDir = tmpdir();
const e2eSrcDir = (...args) => repoRoot('e2e-test', ...args);
const e2eDestDir = (...args) =>
	path.join(tmpDir, 'karmatic', 'e2e-test', ...args);

const noop = () => {};
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const info = chalk.blue;
const error = chalk.red;

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

async function copyDir(srcDir, destDir) {
	const opts = { cwd: repoRoot() };
	if (isWindows) {
		// https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy
		// https://stackoverflow.com/questions/24121046/difference-between-xcopy-and-robocopy
		const robocopyArgs = [
			'/s', // Subdirectories - copy recursively, excludes empty directories
			'/np', // No progress - don't show progress of copying files
			'/nfl', // No file logging
			'/ndl', // No directory logging
			'/is', // Includes same files: identical files will be overwritten
			'/it', // Include 'tweaked' files: files with the same name in source and destination are overwritten
			'/MT', // Multi-threaded copying
			srcDir,
			destDir,
		];

		let cp = execFile('robocopy', robocopyArgs, opts, noop);

		// Information on RoboCopy exit codes: https://ss64.com/nt/robocopy-exit.html
		// Exit codes higher than 7 indicate some kind of error.
		// Returning true means success for the command line utility
		await onExit(cp, (code) => code <= 7);
	} else {
		let cp = execFile('cp', ['-rf', srcDir, destDir], opts, noop);
		await onExit(cp);
	}
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

	console.log(`${info(prefix)} Installing packages for ${name}...`);

	const cp = execFile(npmCmd, args, options, noop);
	cp.stdout.pipe(createPrefixTransform(info(prefix))).pipe(process.stdout);
	cp.stderr.pipe(createPrefixTransform(error(prefix))).pipe(process.stderr);

	await onExit(cp);
}

async function runTests(projectPath, prefix) {
	const pkgJsonPath = path.join(projectPath, 'package.json');
	const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));

	console.log(`${info(prefix)} Updating package.json with karmatic path...`);
	pkg.dependencies['karmatic'] = pathToFileURL(repoRoot());
	const newContents = JSON.stringify(pkg, null, 2);
	await fs.writeFile(pkgJsonPath, newContents, 'utf8');

	await npmInstall(projectPath, prefix);

	const opts = { cwd: projectPath };
	let cmd, args;
	if (pkg.scripts && pkg.scripts.test) {
		cmd = npmCmd;
		args = ['test'];
		console.log(`${info(prefix)} Running npm test...`);
	} else {
		cmd = process.execPath;
		args = ['node_modules/karmatic/dist/cli.js', 'run'];
		console.log(`${info(prefix)} Running karmatic...`);
	}

	const cp = execFile(cmd, args, opts);
	cp.stdout.pipe(createPrefixTransform(info(prefix))).pipe(process.stdout);
	cp.stderr.pipe(createPrefixTransform(error(prefix))).pipe(process.stderr);

	try {
		await onExit(cp);
	} catch (error) {
		console.error(error(prefix) + ` Test run failed: ${error.message}`);
	}
}

async function main() {
	process.on('exit', (code) => {
		if (code !== 0) {
			console.log(
				error('A fatal error occurred. Check the logs above for details.')
			);
		}
	});

	console.log(`Copying e2e-tests to ${e2eDestDir()}...`);
	await fs.mkdir(e2eDestDir(), { recursive: true });
	await copyDir(e2eSrcDir(), e2eDestDir());

	let entries = await fs.readdir(e2eDestDir(), { withFileTypes: true });
	let projects = entries.filter((p) => p.isDirectory).map((p) => p.name);

	const length = projects.reduce((max, name) => Math.max(max, name.length), 0);
	const getPrefix = (name) => `[${name.padEnd(length)}]`;

	try {
		// TODO: Consider parallelizing the test runs
		// await pool(projects, (p) => runTests(e2eDestDir(p), getPrefix(p)));
		for (let project of projects) {
			await runTests(e2eDestDir(project), getPrefix(project));
		}
	} catch (e) {
		console.error(e);
		process.exitCode = 1;
	}
}

main();
