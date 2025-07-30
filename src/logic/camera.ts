import { mat4, vec3 } from "gl-matrix";
import type { State } from "./state";

export const stepCameraWobble = (state: State) => {
	const l = 10;

	state.camera.eye[0] = 0 + (state.pointer.x - 0.5) * 2;
	state.camera.eye[1] = l;
	state.camera.eye[2] = l + -(state.pointer.y - 0.5) * 2;
};

const zero = [0, 0, 0] as vec3;
const up = [0, 0, 1] as vec3;
export const deriveViewMatrix = (state: State) => {
	mat4.lookAt(state.viewMatrix, state.camera.eye, zero, up);
};
