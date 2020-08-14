import { render } from '../src/index';

describe('Render result', () => {
	it('should have a _value1 property', () => {
		const result = render(1, 2);
		expect('_value1' in result.props).toBe(true);
		expect(result.props._value1).toBe(1);
	});
	it('should have a __v2 property', () => {
		const result = render(1, 2);
		expect('_value2' in result.props).toBe(false);
		expect(result.props.__v2).toBe(2);
	});
	it('should have a __t property', () => {
		const result = render(1, 2);
		expect('tag' in result).toBe(false);
		expect(result.__t).toBe('div');
	});
});
