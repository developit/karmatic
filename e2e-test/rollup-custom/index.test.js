import { box } from './index';

describe('Box', () => {
	it('should not be bundled using webpack', () => {
		// eslint-disable-next-line camelcase
		expect(typeof __webpack_require__).toBe('undefined');
	});

	it('should have a __v property', () => {
		const boxed = box(1);
		expect('_value' in boxed).toBe(false);
		expect(boxed.__v).toBe(1);
	});
});
