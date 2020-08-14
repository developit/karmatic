import createWorker from 'workerize-loader!./fixture.worker.js';

let worker;
export function getWorker() {
	if (!worker) {
		worker = createWorker();
	}

	return worker;
}
