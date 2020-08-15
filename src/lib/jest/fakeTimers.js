import { withGlobal } from '@sinonjs/fake-timers';

// TODO: add tests from https://github.com/facebook/jest/blob/e8b7f57e05e3c785c18a91556dcbc7212826a573/packages/jest-fake-timers/src/__tests__/modernFakeTimers.test.ts
// Based on https://github.com/facebook/jest/blob/e8b7f57e05e3c785c18a91556dcbc7212826a573/packages/jest-fake-timers/src/modernFakeTimers.ts
export default class FakeTimers {
	/**
	 * @param {{ global: Window, maxLoops: number }} options
	 */
	constructor({
		global,
		// config,
		maxLoops,
	}) {
		this._global = global;
		// this._config = config;
		this._maxLoops = maxLoops || 100000;

		this._fakingTime = false;
		this._fakeTimers = withGlobal(global);
	}

	clearAllTimers() {
		if (this._fakingTime) {
			this._clock.reset();
		}
	}

	dispose() {
		this.useRealTimers();
	}

	runAllTimers() {
		if (this._checkFakeTimers()) {
			this._clock.runAll();
		}
	}

	runOnlyPendingTimers() {
		if (this._checkFakeTimers()) {
			this._clock.runToLast();
		}
	}

	advanceTimersToNextTimer(steps = 1) {
		if (this._checkFakeTimers()) {
			for (let i = steps; i > 0; i--) {
				this._clock.next();
				// Fire all timers at this point: https://github.com/sinonjs/fake-timers/issues/250
				this._clock.tick(0);

				if (this._clock.countTimers() === 0) {
					break;
				}
			}
		}
	}

	/**
	 * @param {number} msToRun
	 */
	advanceTimersByTime(msToRun) {
		if (this._checkFakeTimers()) {
			this._clock.tick(msToRun);
		}
	}

	runAllTicks() {
		if (this._checkFakeTimers()) {
			// @ts-expect-error
			this._clock.runMicrotasks();
		}
	}

	useRealTimers() {
		if (this._fakingTime) {
			this._clock.uninstall();
			this._fakingTime = false;
		}
	}

	useFakeTimers() {
		if (!this._fakingTime) {
			/** @type {Array<keyof import('@sinonjs/fake-timers').FakeTimerWithContext['timers']>} */
			// @ts-expect-error
			const toFake = Object.keys(this._fakeTimers.timers);

			this._clock = this._fakeTimers.install({
				loopLimit: this._maxLoops,
				now: Date.now(),
				target: this._global,
				toFake,
			});

			this._fakingTime = true;
		}
	}

	reset() {
		if (this._checkFakeTimers()) {
			const { now } = this._clock;
			this._clock.reset();
			this._clock.setSystemTime(now);
		}
	}

	/**
	 * @param {number | Date} [now]
	 */
	setSystemTime(now) {
		if (this._checkFakeTimers()) {
			this._clock.setSystemTime(now);
		}
	}

	getRealSystemTime() {
		return Date.now();
	}

	getTimerCount() {
		if (this._checkFakeTimers()) {
			return this._clock.countTimers();
		}

		return 0;
	}

	_checkFakeTimers() {
		if (!this._fakingTime) {
			// @ts-expect-error
			this._global.console.warn(
				'A function to advance timers was called but the timers API is not ' +
					'mocked with fake timers. Call `jest.useFakeTimers()` in this test or ' +
					'enable fake timers globally by setting `"timers": "fake"` in the ' +
					'configuration file\nStack Trace:\n' +
					new Error().stack
				// formatStackTrace(new Error().stack!, this._config, {
				//   noStackTrace: false,
				// }),
			);
		}

		return this._fakingTime;
	}
}
