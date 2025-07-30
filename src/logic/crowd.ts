import { mat4 } from "gl-matrix";
import type { AnimationIndex } from "../sprites";
import type { State } from "./state";

export const SPEED = 0.01;

export const stepCrowd = (state: State, animationIndex: AnimationIndex) => {
	for (let i = state.numInstances; i--; ) {
		const tr = state.objectTransforms[i];

		const x = tr[12];
		const y = tr[13];

		let vx = state.velocities[i * 2 + 0];
		let vy = state.velocities[i * 2 + 1];

		let ax = 0;
		let ay = 0;

		//

		const dx = x - state.targets[i * 2 + 0];
		const dy = y - state.targets[i * 2 + 1];

		const l = Math.hypot(dx, dy);

		if (l < 0.3) {
			const A = 10;
			state.targets[i * 2 + 0] = (Math.random() - 0.5) * A;
			state.targets[i * 2 + 1] = (Math.random() - 0.5) * A;
		}

		//
		// apply acceleration

		vx += ax;
		vy += ay;

		state.velocities[i * 2 + 0] = vx;
		state.velocities[i * 2 + 1] = vy;

		tr[12] += vx * SPEED;
		tr[13] += vy * SPEED;
	}
};

export const deriveTransform = (state: State) => {
	for (let i = state.numInstances; i--; ) {
		const tr = state.objectTransforms[i];

		const x = tr[12];
		const y = tr[13];

		const vx = state.velocities[i * 2 + 0];

		mat4.identity(tr);
		mat4.translate(tr, tr, [x, y, 0]);
		mat4.scale(tr, tr, [vx > 0 ? 1 : -1, 1, 1]);
		mat4.rotateX(tr, tr, -Math.PI / 2);

		if (vx > 0.8) {
			mat4.rotateZ(tr, tr, 0.1);
		}
		if (vx < -0.8) {
			mat4.rotateZ(tr, tr, 0.1);
		}
	}
};
