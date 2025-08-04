import { mat4 } from "gl-matrix";
import type { AnimationIndex } from "../sprites";
import type { State } from "./state";

export const SPEED = 0.04;

export const stepCrowd = (state: State, animationIndex: AnimationIndex) => {
	for (const runner of state.runners) {
		let vx = runner.velocity[0];
		let vy = runner.velocity[1];

		let ax = 0;
		let ay = 0;

		//

		const dx = runner.target[0] - runner.position[0];
		const dy = runner.target[1] - runner.position[1];

		const l = Math.hypot(dx, dy);

		if (l < SPEED * 5) {
			const A = 10;
			runner.target[0] = (Math.random() - 0.5) * A;
			runner.target[1] = (Math.random() - 0.5) * A;

			continue;
		}

		vx = dx / l;
		vy = dy / l;

		//
		// apply acceleration

		vx += ax;
		vy += ay;

		runner.velocity[0] = vx;
		runner.velocity[1] = vy;

		runner.position[0] += vx * SPEED;
		runner.position[1] += vy * SPEED;
	}
};
