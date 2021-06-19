# adaptive-accrual-failure-detector

[![npm version](https://badge.fury.io/js/adaptive-accrual-failure-detector.svg)](https://badge.fury.io/js/adaptive-accrual-failure-detector)

Failure detection for processes, connections and distributed systems. This is
an implementation for JavaScript and TypeScript of a failure detector that uses
an adaptive accrual algorithm. The theory of this detector is taken from the paper
[A New Adaptive Accrual Failure Detector for Dependable Distributed System](https://www.informatik.uni-augsburg.de/lehrstuehle/sik/publikationen/papers/2007_sac-dads_sat/paper.pdf)
authored by Benjamin Satzger, Andreas Pietzowski, Wolfang Trumler and 
Theo Ungerer.

This detector is useful for detecting things such as network failures between
two nodes.

## Usage

The failure detector is based on incoming heartbeats and has a few options that
can be used when creating the detector:

*
  `sampleSize` - number of samples kept and used when calculating probability
  of a failure. A higher number of samples means the probability calculation is
  more stable but uses more memory. Default is `1000`.
*
  `scalingFactor` - factor used to scale failure probabilities, used to reduce
  overestimation of failure. Default is `0.9`.
*
  `failureThreshold` - the probability needed to to detect something as a
  failure. If the probability of failure is above this the thing being 
  monitored is considered failed. Default is `0.5`.

```javascript
// Using ES Module environment
import { FailureDetector } from 'adaptive-accrual-failure-detector';

const detector = new FailureDetector({
  failureThreshold: 0.6
});
```

When you receive a heartbeat you should call `registerHeartbeat` on the detector:

```javascript
detector.registerHeartbeat();
```

To calculate if a failure has occurred you can call `checkFailure()` or
`calculateFailureProbability()`:

```javascript
// Check failure, will return true if failed
const isFailed = detector.checkFailure();

// Calculate the probability of failure between 0 and 1
const failureProbability = detector.calculateFailureProbability();
```
