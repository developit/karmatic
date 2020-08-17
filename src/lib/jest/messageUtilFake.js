// As of writing, the [jest-message-util] package has a dependency on graceful-fs
// to read file contents mentioned in the stack trace to produce code frames for
// errors. Since this module is running in the browser and not in Node, we'll
// mock out this module for now so `expect` (and other Jest packages) can run in
// the browser. Karmatic adds code frames when errors are reported from the
// browser to the Karma server which has file system access to add code frames.
//
// jest-message-util:
// https://npmfs.com/package/jest-message-util/26.3.0/package.json#L20

// Based on https://github.com/facebook/jest/blob/c9c8dba4dd8de34269bdb971173659399bcbfd55/packages/jest-message-util/src/index.ts

/**
 * @param {Error} error
 * @returns {string}
 */
export function formatExecError(error) {
	return error.stack;
}

/**
 * @param {string} stack
 * @returns {string[]}
 */
export function getStackTraceLines(stack) {
	return stack.split(/\n/);
}

/**
 * @param {string[]} lines
 * @returns {Frame}
 */
export function getTopFrame(lines) {
	throw new Error('Not implemented: messageUtilFake.js:getTopFrame');
}

/**
 * @param {string} stack
 * @returns {string}
 */
export function formatStackTrace(stack) {
	return stack;
}

export function formatResultsErrors() {
	throw new Error('Not implemented: messageUtilsFake.js:formatResultsErrors');
}

const errorRegexp = /^Error:?\s*$/;

/** @type {(str: string) => string} */
const removeBlankErrorLine = (str) =>
	str
		.split('\n')
		// Lines saying just `Error:` are useless
		.filter((line) => !errorRegexp.test(line))
		.join('\n')
		.trimRight();

/**
 * @param {string} content
 * @returns {{ message: string; stack: string; }}
 */
export function separateMessageFromStack(content) {
	if (!content) {
		return { message: '', stack: '' };
	}

	// All lines up to what looks like a stack -- or if nothing looks like a stack
	// (maybe it's a code frame instead), just the first non-empty line.
	// If the error is a plain "Error:" instead of a SyntaxError or TypeError we
	// remove the prefix from the message because it is generally not useful.
	const messageMatch = content.match(
		/^(?:Error: )?([\s\S]*?(?=\n\s*at\s.*:\d*:\d*)|\s*.*)([\s\S]*)$/
	);
	if (!messageMatch) {
		// For typescript
		throw new Error('If you hit this error, the regex above is buggy.');
	}
	const message = removeBlankErrorLine(messageMatch[1]);
	const stack = removeBlankErrorLine(messageMatch[2]);
	return { message, stack };
}
