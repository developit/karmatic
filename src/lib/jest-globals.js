import './jest/nodeJSGlobals';
import expect from 'expect';
import { ModuleMocker } from 'jest-mock';

function notImplemented() {
	throw Error(`Not Implemented`);
}

const global = window;
global.ModuleMocker = ModuleMocker;
global.expect = expect;

const moduleMocker = new ModuleMocker(global);

// @todo expect.extend() et al

// @todo Consider this teardown function: https://github.com/facebook/jest/blob/e8b7f57e05e3c785c18a91556dcbc7212826a573/packages/jest-runtime/src/index.ts#L871

// @todo - check if jasmine allows `it` without `describe`
global.test = it;

// @todo - add it.skip, etc.

// Based on https://github.com/facebook/jest/blob/e8b7f57e05e3c785c18a91556dcbc7212826a573/packages/jest-runtime/src/index.ts#L1501-L1578
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
	clearAllMocks() {
		moduleMocker.clearAllMocks();
		return this;
	},
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
	fn: moduleMocker.fn.bind(moduleMocker),
	genMockFromModule(moduleName) {
		// return this._generateMock(from, moduleName);
		notImplemented();
	},
	getRealSystemTime: notImplemented,
	getTimerCount() {
		// return _getFakeTimers().getTimerCount();
		notImplemented();
	},
	isMockFunction: moduleMocker.isMockFunction,
	isolateModules: notImplemented,
	mock: jasmine.createSpy, // @todo check
	// requireActual: require,
	requireMock: notImplemented,
	resetAllMocks() {
		moduleMocker.resetAllMocks();
		return this;
	},
	resetModuleRegistry: notImplemented,
	resetModules: notImplemented,
	restoreAllMocks() {
		moduleMocker.restoreAllMocks();
		return this;
	},
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
	spyOn: moduleMocker.spyOn.bind(moduleMocker),
	unmock: (mock) => mock.restore(), // @todo check
	useFakeTimers: notImplemented,
	useRealTimers: notImplemented,
};
