import worker from 'workerize-loader!./fixture.worker.js';

describe('demo', () => {
	it('should do MAGIC', async () => {
		let mod = worker();
		expect(mod.foo).toEqual(jasmine.any(Function));
		expect(await mod.foo()).toEqual(1);
	});
});
