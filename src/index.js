import { Server } from 'karma';
import configure from './configure';

export default async function karmatic(options) {
	let config = configure(options);

	if (!options.watch) config.singleRun = true;

	let server = createServer(config);

	server.start();

	return await server.completion;
}

function createServer(config) {
	let resolve, reject;

	let promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});

	let callback = (code) => {
		if (code === 0) return resolve();
		let err = Error(`Exit ${code}`);
		err.code = code;
		reject(err);
	};

	let server = new Server(config, callback);

	server.completion = promise;
	return server;
}
