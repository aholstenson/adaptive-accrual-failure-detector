import { FailureDetector } from '../src';

function withDiffs(fd: FailureDetector, ...samples: number[]) {
	let time = 0;
	fd.registerHeartbeat(0);

	for(const s of samples) {
		time += s;
		fd.registerHeartbeat(time);
	}

	return time;
}

it('No variation', () => {
	const fd = new FailureDetector();
	const lastTime = withDiffs(fd, 1, 1, 1, 1);

	const p0 = fd.calculateFailureProbability(lastTime);
	expect(p0).toEqual(0);

	const p1 = fd.calculateFailureProbability(lastTime + 1);
	expect(p1).toEqual(0);

	const p2 = fd.calculateFailureProbability(lastTime + 2);
	expect(p2).toEqual(1);
});

it('Small variation', () => {
	const fd = new FailureDetector();
	const lastTime = withDiffs(fd, 1010, 1023, 1012, 1032, 1016, 1020, 990, 1028);

	const p0 = fd.calculateFailureProbability(lastTime + 500);
	expect(p0).toEqual(0);

	const p1 = fd.calculateFailureProbability(lastTime + 1000);
	expect(p1).toEqual(0);

	const p2 = fd.calculateFailureProbability(lastTime + 1100);
	expect(p2).toBeGreaterThanOrEqual(0.142);
	expect(p2).toBeLessThanOrEqual(0.143);

	const p3 = fd.calculateFailureProbability(lastTime + 2100);
	expect(p3).toEqual(1);
});
