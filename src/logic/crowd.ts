import { mat4, vec2 } from "gl-matrix";
import type { AnimationIndex } from "../sprites";
import { goal, MAX_ENTITIES, Runner, State } from "./state";

// acceleration array
const accelerations = Array.from(
	{ length: MAX_ENTITIES },
	() => new Float32Array(2),
);

export const stepRunnerLogic = (
	state: State,
	animationIndex: AnimationIndex,
) => {
	for (const runner of state.runners) {
		if (runner.goal === goal.idle) {
			if (runner.randomTargetCount === 0) {
				(runner as Runner).goal = goal.goToTarget;
				vec2.copy((runner as any).target, runner.finalTarget);

				// runner.randomTargetCount = -1;

				runner.animationIndex = animationIndex.jump;
				runner.animationFrameDuration = 4;
			} else if (runner.randomTargetCount > 0) {
				(runner as Runner).goal = goal.goToTarget;

				const A = 16 + Math.random() * 16;
				const a = Math.random() * Math.PI * 2;
				vec2.set((runner as any).target, Math.sin(a) * A, Math.cos(a) * A);

				runner.randomTargetCount--;

				runner.animationIndex = animationIndex.walk;
				runner.animationFrameDuration = 2;
			} else {
				runner.animationIndex = animationIndex.jump;
				runner.animationFrameDuration = 3;
			}
		}
	}
};

export const stepCrowd = (state: State) => {
	//
	// prepare acceleration list
	for (let i = state.runners.length; i--; ) {
		const runner = state.runners[i];

		const a = accelerations[i];
		const v = runner.velocity;
		const p = runner.position;

		//
		// reset acceleration
		a[0] = 0;
		a[1] = 0;

		//
		// friction
		const F_friction = 0.16;
		a[0] += -v[0] * F_friction;
		a[1] += -v[1] * F_friction;

		if (runner.goal !== goal.goToTarget) continue;

		//
		// going forward the target

		const dx = runner.target[0] - p[0];
		const dy = runner.target[1] - p[1];

		const l = Math.hypot(dx, dy);

		if (l < 0.2) {
			p[0] = runner.target[0];
			p[1] = runner.target[1];

			(runner as Runner).goal = goal.idle;

			continue;
		}

		const F_attraction = 0.02;
		a[0] += (dx / l) * F_attraction;
		a[1] += (dy / l) * F_attraction;
	}

	//
	// entities repulsion
	for (let i = state.runners.length; i--; ) {
		const a1 = accelerations[i];
		const p1 = state.runners[i].position;

		for (let j = i; j--; ) {
			const a2 = accelerations[j];
			const p2 = state.runners[j].position;

			const dx = p1[0] - p2[0];
			const dy = p1[1] - p2[1];

			// const lSq = dx * dx + dy * dy;
			// if (lSq > 3 * 3) continue;

			const l = Math.hypot(dx, dy) + 0.00001; // to avoid division by zero
			const F_repulsion = 0.007;
			const lc = l + 0.1;
			const f = F_repulsion / (lc * lc);
			a1[0] += (dx / l) * f;
			a1[1] += (dy / l) * f;

			a2[0] -= (dx / l) * f;
			a2[1] -= (dy / l) * f;
		}
	}

	//
	// apply acceleration
	for (let i = state.runners.length; i--; ) {
		const runner = state.runners[i];

		const a = accelerations[i];
		const v = runner.velocity;
		const p = runner.position;

		v[0] += a[0];
		v[1] += a[1];

		p[0] += v[0];
		p[1] += v[1];
	}
};
