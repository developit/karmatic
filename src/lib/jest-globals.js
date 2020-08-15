import expect from 'expect';

function notImplemented() {
	throw Error(`Not Implemented`);
}

global.expect = expect;

// @todo expect.extend() et al

global.jest = {
	addMatchers(matchers) {
		jasmine.addMatchers(matchers);
	},
	advanceTimersByTime(msToRun) {
		// _getFakeTimers().advanceTimersByTime(msToRun);
		notImplemented();
	},
	advanceTimersToNextTimer(steps) {
		// _getFakeTimers().advanceTimersToNextTimer(steps);
		notImplemented();
	},
	autoMockOff: notImplemented,
	autoMockOn: notImplemented,
	clearAllMocks: notImplemented,
	clearAllTimers() {
		// _getFakeTimers().clearAllTimers();
		notImplemented();
	},
	createMockFromModule(moduleName) {
		// return this._generateMock(from, moduleName);
		notImplemented();
	},
	deepUnmock: notImplemented,
	disableAutomock: notImplemented,
	doMock: notImplemented,
	dontMock: notImplemented,
	enableAutomock: notImplemented,
	fn: jasmine.createSpy,
	genMockFromModule(moduleName) {
		// return this._generateMock(from, moduleName);
		notImplemented();
	},
	getRealSystemTime: notImplemented,
	getTimerCount() {
		// return _getFakeTimers().getTimerCount();
		notImplemented();
	},
	isMockFunction(fn) {
		// check if spy/mock
		notImplemented();
	},
	isolateModules: notImplemented,
	mock: jasmine.createSpy, // @todo check
	requireActual: require,
	requireMock: notImplemented,
	resetAllMocks: notImplemented,
	resetModuleRegistry: notImplemented,
	resetModules: notImplemented,
	restoreAllMocks: notImplemented,
	retryTimes: notImplemented,
	runAllImmediates() {
		notImplemented();
	},
	runAllTicks: notImplemented,
	runAllTimers: notImplemented,
	runOnlyPendingTimers: notImplemented,
	runTimersToTime: notImplemented,
	setMock: notImplemented,
	setSystemTime(now) {
		notImplemented();
	},
	setTimeout,
	spyOn: jasmine.createSpy, // @todo check
	unmock: (mock) => mock.restore(), // @todo check
	useFakeTimers: notImplemented,
	useRealTimers: notImplemented,
};
