const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe('Basic test functions', () => {
	it('should be not bundled using webpack', () => {
		// eslint-disable-line camelcase
		expect(typeof __webpack_require__).toBe('undefined');
	});

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
		expect(now - start).toBeGreaterThan(50);
	});
});
