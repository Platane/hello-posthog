import { mat4, vec3 } from "gl-matrix";
import type { State } from "./state";

let maxProgress = 0;
export const stepProgress = (state: State) => {
	const p = state.runners.reduce(
		(sum, runner) => sum + runner.randomTargetCount,
		0,
	);
	maxProgress = Math.max(maxProgress, p);

	// console.log(p / maxProgress);
};

const zero = [0, 0, 0] as vec3;
const up = [0, 0, 1] as vec3;
export const deriveViewMatrix = (state: State) => {
	mat4.lookAt(state.viewMatrix, state.camera.eye, zero, up);
};
