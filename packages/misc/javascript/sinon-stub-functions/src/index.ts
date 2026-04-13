import { stub } from "sinon";

import { type RecursionOptions, replaceFunctions } from "replace-functions";

const stubFunctions = <T>(
	value: T,
	recursive: RecursionOptions = false,
	onStubFunction: (stubedFn, originalFn) => any = () => {},
) => {
	return replaceFunctions(
		value,
		(originalFn) => {
			const stubedFn = stub();
			onStubFunction(stubedFn, originalFn);
			return stubedFn;
		},
		recursive,
	);
};

export default stubFunctions;
