
const options = Symbol('options');
const samples = Symbol('samples');
const freshnessPoint = Symbol('freshnessPoint');

/**
 * Options that can be used with the failure detector.
 */
export interface FailureDetectorOptions {
	/**
	 * Number of samples to keep in the detector. Used when calculating the
	 * probability that something has failed. A higher number of samples
	 * means the probability calculation is more stable but also means increased
	 * memory usage. Defaults to 1000.
	 */
	sampleSize?: number;

	/**
	 * The scaling factor to use, helps with overestimation of failure
	 * probability. Defaults to 0.9.
	 */
	scalingFactor?: number;

	/**
	 * The threshold that must be met to consider it a failure. If the
	 * probability of failure is above this the thing being monitored is
	 * considered failed. Defaults to 0.5.
	 */
	failureThreshold?: number;
}

/**
 * Version of options that have been resolved so that there are no unknown
 * values. Used to allow less checking for potential undefined values as
 * reported by TypeScript.
 */
interface ResolvedOptions {
	sampleSize: number;
	scalingFactor: number;
	failureThreshold: number;
}

const DEFAULTS: ResolvedOptions = {
	sampleSize: 1000,
	scalingFactor: 0.9,
	failureThreshold: 0.5
};

/**
 * Failure detector for detecting the failure of processes, connections
 * and distributed systems. This implementation uses an adaptive accrual
 * algorithm.
 *
 * The design of the detector is such that it expects to receive a heartbeat
 * at a certain interval. The detector can then be queried to see if the
 * thing be monitored should be considered failed.
 */
export class FailureDetector {
	/**
	 * Resolved options for this failure detector.
	 */
	private [options]: ResolvedOptions;

	/**
	 * Samples that have been received, deltas in milliseconds between
	 * heartbeats.
	 */
	private [samples]: number[];

	/**
	 * Freshness point, the timestamp in milliseconds of the last heartbeat
	 * received.
	 */
	private [freshnessPoint]: number;

	constructor(opts?: FailureDetectorOptions) {
		this[options] = Object.assign({}, DEFAULTS, opts);

		this[samples] = [];
		this[freshnessPoint] = 0;
	}

	/**
	 * Register a heartbeat received from the thing being monitored.
	 *
	 * @param {Number} timestamp
	 *   the time at which the heartbeat was received
	 */
	public registerHeartbeat(timestamp: number=Date.now()): void {
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
	public calculateFailureProbability(timestamp: number=Date.now()): number {
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
	 * Check if a failure has occurred. This calculates the probability of a
	 * failure and returns if is equal to or higher than `failureThreshold`.
	 *
	 * @param {Number} timestamp
	 *   the current time
	 */
	public checkFailure(timestamp: number=Date.now()): boolean {
		return this.calculateFailureProbability(timestamp) >= this[options].failureThreshold;
	}
}
