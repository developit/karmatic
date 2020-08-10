import { render } from './index';

describe('render', () => {
	it('outputs Hello World', () => {
		const scratch = document.createElement('div');
		document.body.appendChild(scratch);

		render(scratch);

		expect(scratch.innerHTML).toBe('<div>Hello World!</div>');
	});
});
