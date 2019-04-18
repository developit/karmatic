import worker from 'workerize-loader!./fixture.worker.js';

const sleep = ms => new Promise( r => setTimeout(r, ms) );

describe('demo', () => {
	it('should work', () => {
		expect(1).toEqual(1);
	});

	it('should handle deep equality', () => {
		expect({ foo: 1 }).toEqual({ foo: 1 });
	});

	it('should handle async tests', async () => {
		let start = Date.now();
		await sleep(100);

		let now = Date.now();
		expect(now-start).toBeGreaterThan(50);
	});

	it('should do MAGIC', async () => {
		let mod = worker();
		expect(mod.foo).toEqual(jasmine.any(Function));
		expect(await mod.foo()).toEqual(1);
	});
});
