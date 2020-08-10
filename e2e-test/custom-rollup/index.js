function createElement(type, props, ...children) {
	if (typeof type == 'function') {
		return type({ children, ...props });
	}

	let attrs = '';
	for (let key in props) {
		attrs += ` ${key}="${props[key]}"`;
	}

	return `<${type}${attrs}>${children.join('')}</${type}>`;
}

function App() {
	return <div>Hello World!</div>;
}

export function render(container) {
	const app = <App />;
	container.appendChild(app);
}
