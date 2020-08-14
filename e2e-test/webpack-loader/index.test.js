import { getWorker } from './index';

describe('demo', () => {
	it('should be bundled using webpack', () => {
		// eslint-disable-line camelcase
		expect(typeof __webpack_require__).toBe('function');
	});

	it('should do MAGIC', async () => {
		let worker = getWorker();

		expect(worker.foo).toEqual(jasmine.any(Function));
		expect(await worker.foo()).toEqual(1);
	});
});
