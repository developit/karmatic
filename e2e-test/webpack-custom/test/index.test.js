import { box } from '../src/index';

describe('Box', () => {
	it('should be bundled using webpack', () => {
		// eslint-disable-line camelcase
		expect(typeof __webpack_require__).toBe('function');
	});

	it('should have a __v property', () => {
		const boxed = box(1);
		expect('_value' in boxed).toBe(false);
		expect(boxed.__v).toBe(1);
	});
});
