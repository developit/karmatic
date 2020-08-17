describe('jest-style', () => {
	describe('not.stringContaining', () => {
		const expected = 'Hello world!';

		it('matches if the received value does not contain the expected substring', () => {
			expect('How are you?').toEqual(expect.not.stringContaining(expected));
		});
	});

	describe('jest.fn', () => {
		it('exists', () => {
			expect(typeof jest).toBe('object');
		});
	});
});
