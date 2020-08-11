import { box } from '../src/index';

describe('Box', () => {
	it('should have a __v property', () => {
		const boxed = box(1);
		expect('_value' in boxed).toBe(false);
		expect(boxed.__v).toBe(1);
	});
});
