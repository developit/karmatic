export function combine(input1, input2) {
	const isInput1Array = Array.isArray(input1);
	const isInput2Array = Array.isArray(input2);

	if (typeof input1 !== typeof input2 || isInput1Array !== isInput2Array) {
		const input1Type = isInput1Array ? 'array' : typeof input1;
		const input2Type = isInput2Array ? 'array' : typeof input2;
		throw new Error(
			`Types of inputs are not the same: input1=${input1Type}, input2=${input2Type}`
		);
	}

	if (typeof input1 == 'string' || typeof input1 == 'number') {
		return input1 + input2;
	}

	if (isInput1Array) {
		return [...input1, ...input2];
	}

	if (typeof input1 == 'object') {
		return {
			...input1,
			...input2,
		};
	}

	throw new Error(`Unsupported type: ${typeof input1}`);
}
