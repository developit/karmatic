import { render } from './index';

describe('Hello World', () => {
	it('should not be bundled using webpack', () => {
		// eslint-disable-next-line camelcase
		expect(typeof __webpack_require__).toBe('undefined');
	});

	it('should be rendered to container', () => {
		render(document.body);

		let element = document.getElementById('hello-world');
		expect(element).toBeTruthy();
		expect(element.textContent).toBe('Hello World!');
	});
});
