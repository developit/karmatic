import { combine } from './index';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe('Basic test functions', () => {
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

describe('combine', () => {
	it('should concatenate strings', () => {
		expect(combine('a', 'b')).toBe('ab');
	});

	it('should add numbers', () => {
		expect(combine(1, 2)).toBe(3);
	});

	it('should concatenate arrays', () => {
		expect(combine([1, 2], ['a', 'b'])).toEqual([1, 2, 'a', 'b']);
	});

	it('should merge objects', () => {
		expect(combine({ a: 1, b: 2 }, { c: 'c', d: 'd', a: 'a' })).toEqual({
			a: 'a',
			b: 2,
			c: 'c',
			d: 'd',
		});
	});

	it('throw an error if types do not match', () => {
		expect(() => combine('a', 1)).toThrow();
		expect(() => combine(1, 'a')).toThrow();

		expect(() => combine([1], 1)).toThrow();
		expect(() => combine(1, [1])).toThrow();

		expect(() => combine({}, 2)).toThrow();
		expect(() => combine(1, {})).toThrow();
	});

	it('throw an error if type is unsupported', () => {
		expect(() =>
			combine(
				() => {},
				() => {}
			)
		).toThrow();

		expect(() => combine(true, false)).toThrow();

		expect(() => combine(Symbol.for('a'), Symbol.for('b'))).toThrow();
	});
});
