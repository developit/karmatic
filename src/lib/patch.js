import chalk from 'chalk';

let { write } = process.stdout;
process.stdout.write = msg => {
	let matches = msg.match(/^LOG ([A-Z]+): ([\s\S]*)$/);
	if (matches) {
		msg = chalk.bgBlueBright.white(' '+matches[1]+': ') + ' ' + chalk.blue(matches[2]);
	}
	return write.call(process.stdout, msg);
};
