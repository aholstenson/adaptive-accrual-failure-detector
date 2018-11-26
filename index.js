'use strict';

const DEFAULTS = {
	// Number of samples to keep
	sampleSize: 1000,
	// The scaling factor to use, to help with overstimation of failure probability
	scalingFactor: 0.9,
	// The threshold that must be met to consider something a failure
	failureThreshold: 0.5
};

const options = Symbol('options');
const samples = Symbol('samples');
const freshnessPoint = Symbol('freshnessPoint');

module.exports = class FailureDetector {

	constructor(opts) {
		this[options] = Object.assign({}, DEFAULTS, opts);

		this[samples] = [];
	}

	/**
	 * Register a heartbeat received from the thing being monitored.
	 *
	 * @param {Number} timestamp
	 *   the time at which the heartbeat was received
	 */
	registerHeartbeat(timestamp=Date.now()) {
		if(this[freshnessPoint]) {
			const timeDelta = timestamp - this[freshnessPoint];
			this[freshnessPoint] = timestamp;

			this[samples].push(timeDelta);

			if(this[samples].length > this[options].sampleSize) {
				this[samples].splice(0, 1);
			}
		} else {
			this[freshnessPoint] = timestamp;
		}
	}

	/**
	 * Calculate the probability that the thing being monitored has failed.
	 *
	 * @param {Number} timestamp
	 *   the current time
	 */
	calculateFailureProbability(timestamp=Date.now()) {
		/*
		 * If freshness point is not available no heartbeat has been received,
		 * so failure probability is zero.
		 */
		if(! this[freshnessPoint]) return 0.0;

		const threshold = (timestamp - this[freshnessPoint]) * this[options].scalingFactor;

		let matchingSamples = 0;
		for(const sample of this[samples]) {
			if(sample <= threshold) matchingSamples++;
		}

		return matchingSamples / this[samples].length;
	}

	/**
	 * Check if a failure has occured. This calculates the probability of a
	 * failure and returns if is equal to or higher than `failureThreshold`.
	 *
	 * @param {Number} timestamp
	 *   the current time
	 */
	checkFailure(timestamp=Date.now()) {
		return this.calculateFailureProbability(timestamp) >= this[options].failureThreshold;
	}
};
