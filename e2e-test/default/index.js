export function render(container) {
	let div = document.createElement('div');
	div.id = 'hello-world';
	div.textContent = 'Hello World!';

	container.appendChild(div);
}
