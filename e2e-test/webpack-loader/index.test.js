import { getWorker } from './index';

describe('demo', () => {
	it('should do MAGIC', async () => {
		let worker = getWorker();

		expect(worker.foo).toEqual(jasmine.any(Function));
		expect(await worker.foo()).toEqual(1);
	});
});
