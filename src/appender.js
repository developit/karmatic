import chalk from 'chalk';
import { cleanStack } from './lib/util';

export function configure(config, layouts) {
	let layout = layouts.colouredLayout;
	return (logEvent) => {
		process.stdout.write(
			chalk.red(cleanStack(layout(logEvent, config.timezoneOffset))) + '\n'
		);
	};
}
