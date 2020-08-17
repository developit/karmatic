import { combine } from '../src/index';

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
