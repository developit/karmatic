import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

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

let firstFile;
export function cleanStack(str, cwd = process.cwd()) {
	str = str.replace(/^[\s\S]+\n\n([A-Za-z]*Error: )/g, '$1');

	firstFile = null;

	let clean = str.replace(
		new RegExp(
			`( |\\()(https?:\\/\\/localhost:\\d+\\/base\\/|webpack:///|${cwd.replace(
				/([\\/[\]()*+$!^.,?])/g,
				'\\$1'
			)}\\/*)?([^\\s():?]*?)(?:\\?[a-zA-Z0-9]+?)?(:\\d+(?::\\d+)?)`,
			'g'
		),
		replacer
	);
	if (firstFile != null) {
		let [filename, line, char] = firstFile;
		if (line) {
			let read;
			try {
				read = fs.readFileSync(path.resolve(cwd, filename), 'utf8');
			} catch (e) {}
			if (read) {
				let start = Math.max(0, char - 40);
				let startLine = Math.max(0, line - 3);
				read = read.split('\n');
				clean = clean.replace(/\n +/g, '\n  ');
				if (line < read.length) {
					clean +=
						'\n\n' +
						chalk.white(
							highlight(
								outdent(
									[
										read.slice(startLine, line).join('\n'),
										read[line].substr(start, char + 30),
										new Array(char).join('-') + '^',
										read.slice(line + 1, line + 4).join('\n'),
									].join('\n'),
									'    ',
									process.stdout.columns - 10
								),
								line - startLine,
								2
							)
						);
				}
			}
		}
	}
	return chalk.red(clean);
}

function replacer(str, before, root, filename, position) {
	if (firstFile == null) {
		let [line, char] = position.match(/\d+/g) || [];
		firstFile = [filename, line - 1, char | 0];
	}
	return before + chalk.blue('./' + filename + chalk.dim(position));
}

function highlight(text, line, count) {
	let lines = text.split('\n');
	return (
		chalk.dim(lines.slice(0, line).join('\n')) +
		'\n' +
		lines.slice(line, line + count).join('\n') +
		'\n' +
		chalk.dim(lines.slice(line + count).join('\n'))
	);
}

function outdent(str, prefix = '', width = 80) {
	str = str.replace(/(^\n+|\n+$)/g, '').replace(/\t/, '    ');
	let indents = str.match(/^[ -]+/gm) || [];
	let minLength = indents.reduce(
		(indent, value) => Math.min(indent, value.length),
		indents[0] ? indents[0].length : 0
	);
	str = str.replace(/^[ -]+/gm, (str) => prefix + str.substring(minLength));
	str = str.replace(/^.*$/gm, (str) => str.substring(0, width));
	return str;
}
