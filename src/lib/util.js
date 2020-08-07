import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { createCodeFrame } from 'simple-code-frame';
import { parseStackTrace } from 'errorstacks';

const cwd = process.cwd();
export const res = (file) => path.resolve(cwd, file);

export function moduleDir(name) {
	let file = require.resolve(name),
		find = `${path.sep}node_modules${path.sep}${name}`,
		index = file.indexOf(find);
	return file.substring(0, index + find.length);
}

export function fileExists(file) {
	try {
		return fs.statSync(file).isFile();
	} catch (e) {}
	return false;
}

export function readFile(file) {
	try {
		return fs.readFileSync(file, 'utf8');
	} catch (e) {}
}

export function readDir(file) {
	try {
		return fs.readdirSync(file);
	} catch (e) {}
}

export function tryRequire(file) {
	if (fileExists(file)) return require(file);
}

export function dedupe(value, index, arr) {
	return arr.indexOf(value) === index;
}

export function indent(str, level) {
	const space = ' '.repeat(level);
	return str
		.split('\n')
		.map((line) => space + line)
		.join('\n');
}

/**
 * Colorize a pre-formatted code frame
 * @param {string} str
 */
export function highlightCodeFrame(str) {
	return str
		.split('\n')
		.map((line) => {
			if (/^>\s(.*)/.test(line)) {
				return line.replace(/^>(.*)/, (_, content) => {
					return chalk.bold.redBright('>') + chalk.white(content);
				});
			} else if (/^\s+\|\s+\^/.test(line)) {
				return line
					.replace('|', chalk.dim('|'))
					.replace('^', chalk.bold.redBright('^'));
			}
			return chalk.dim(line);
		})
		.join('\n');
}

export function cleanStack(str, cwd = process.cwd()) {
	str = str.replace(/^[\s\S]+\n\n([A-Za-z]*Error: )/g, '$1');

	let stack = str.replace(
		new RegExp(
			`( |\\()(https?:\\/\\/localhost:\\d+\\/base\\/|webpack:///|${cwd.replace(
				/([\\/[\]()*+$!^.,?])/g,
				'\\$1'
			)}\\/*)?([^\\s():?]*?)(?:\\?[a-zA-Z0-9]+?)?(:\\d+(?::\\d+)?)`,
			'g'
		),
		replacer
	);

	let frames = parseStackTrace(stack);

	// Some frameworks mess with the stack. Use a simple heuristic
	// to find the beginning of the proper stack.
	let message = stack;
	if (frames.length) {
		let lines = stack.split('\n');
		let stackStart = lines.indexOf(frames[0].raw);
		if (stackStart > 0) {
			message = lines
				.slice(0, stackStart)
				.map((s) => s.trim())
				.join('\n');
		}
	}

	/**
	 * The nearest location where the user's code triggered the error.
	 * @type {import('errorstacks').StackFrame}
	 */
	let nearestFrame;

	stack = frames
		.filter((frame) => frame.type !== 'native' || frame.name !== 'Jasmine')
		.map((frame) => {
			// Only show frame for errors in the user's code
			if (
				!nearestFrame &&
				!/node_modules/.test(frame.fileName) &&
				frame.type !== 'native'
			) {
				nearestFrame = frame;
			}

			// Native traces don't have an error location
			if (!frame.name || frame.type === 'native') {
				return chalk.gray(frame.raw.trim());
			}

			const {
				sourceFileName,
				column,
				fileName,
				line,
				name,
				sourceColumn,
				sourceLine,
			} = frame;

			const loc = chalk.cyanBright(`${fileName}:${line}:${column}`);
			const originalLoc =
				sourceFileName !== ''
					? chalk.gray(' <- ') +
					  chalk.gray(`${sourceFileName}:${sourceLine}:${sourceColumn}`)
					: '';
			return chalk.gray(`at ${name} (${loc}${originalLoc})`);
		})
		.join('\n');

	let codeFrame = '';
	if (nearestFrame) {
		try {
			const { fileName, line, column } = nearestFrame;
			if (fileName) {
				const content = fs.readFileSync(fileName, 'utf-8');
				codeFrame = createCodeFrame(content, line - 1, column - 1, {
					before: 2,
					after: 2,
				});
				codeFrame = highlightCodeFrame(codeFrame);
				codeFrame = indent(codeFrame, 2) + '\n';
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.log('INTERNAL WARNING: Failed to read stack frame code: ' + err);
		}
	}

	message = indent(chalk.reset(message), 2);
	return `\n${message}\n\n${codeFrame}${indent(stack, 4)}\n`;
}

function replacer(str, before, root, filename, position) {
	return before + './' + filename + position;
}
