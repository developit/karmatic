import './jest/nodeJSGlobals';
import expect from 'expect';
import { ModuleMocker } from 'jest-mock';
import ModernFakeTimers from '@jest/fake-timers/build/modernFakeTimers';

function notImplemented() {
	throw Error(`Not Implemented`);
}

const global = window;
global.FakeTimers = ModernFakeTimers;
global.ModuleMocker = ModuleMocker;
global.expect = expect;

const moduleMocker = new ModuleMocker(global);
const fakeTimers = new ModernFakeTimers({ global });

// @todo expect.extend() et al

// @todo Consider this teardown function: https://github.com/facebook/jest/blob/e8b7f57e05e3c785c18a91556dcbc7212826a573/packages/jest-runtime/src/index.ts#L871
// @todo And this teardown function: https://github.com/facebook/jest/blob/9ffd368330a3aa05a7db9836be44891419b0b97d/packages/jest-environment-jsdom/src/index.ts#L106
// Definitely need to auto dispose of fakeTimers.dispose in teardown
afterEach(() => {
	fakeTimers.dispose();
});

// @todo - check if jasmine allows `it` without `describe`
global.test = it;

// @todo - add it.skip, etc.
// @todo - add alias for '@jest/globals' that allows users to import these globals: https://jestjs.io/docs/en/api

// Based on https://github.com/facebook/jest/blob/e8b7f57e05e3c785c18a91556dcbc7212826a573/packages/jest-runtime/src/index.ts#L1501-L1578
global.jest = {
	addMatchers(matchers) {
		jasmine.addMatchers(matchers);
	},
	advanceTimersByTime(msToRun) {
		fakeTimers.advanceTimersByTime(msToRun);
	},
	advanceTimersToNextTimer(steps) {
		fakeTimers.advanceTimersToNextTimer(steps);
	},
	autoMockOff: notImplemented,
	autoMockOn: notImplemented,
	clearAllMocks() {
		moduleMocker.clearAllMocks();
		return this;
	},
	clearAllTimers: () => fakeTimers.clearAllTimers(),
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
	getRealSystemTime() {
		return fakeTimers.getRealSystemTime();
	},
	getTimerCount: () => fakeTimers.getTimerCount(),
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
	runAllImmediates: notImplemented,
	runAllTicks: () => fakeTimers.runAllTicks(),
	runAllTimers: () => fakeTimers.runAllTimers(),
	runOnlyPendingTimers: () => fakeTimers.runOnlyPendingTimers(),
	runTimersToTime: (msToRun) => fakeTimers.advanceTimersByTime(msToRun),
	setMock: notImplemented,
	setSystemTime(now) {
		fakeTimers.setSystemTime(now);
	},
	setTimeout(timeout) {
		jasmine._DEFAULT_TIMEOUT_INTERVAL = timeout;
		return this;
	},
	spyOn: moduleMocker.spyOn.bind(moduleMocker),
	unmock: (mock) => mock.restore(), // @todo check
	useFakeTimers() {
		fakeTimers.useFakeTimers();
		return this;
	},
	useRealTimers() {
		fakeTimers.useRealTimers();
		return this;
	},
};
