import { mat4, vec3 } from "gl-matrix";
import type { State } from "./state";

export const stepCameraWobble = (state: State) => {
	const phi = Math.PI / 7 + ((0.5 - state.pointer.y) * Math.PI) / 16;
	const theta = (state.pointer.x - 0.5) * 0.4;
	const radius = 50;

	state.camera.eye[0] = radius * Math.sin(theta) * Math.cos(phi);
	state.camera.eye[1] = radius * Math.cos(theta) * Math.cos(phi);
	state.camera.eye[2] = radius * Math.sin(phi);

	// state.camera.eye[0] = 0 + (state.pointer.x - 0.5) * 2;
	// state.camera.eye[1] = l;
	// state.camera.eye[2] = l * 0.5 + -(state.pointer.y - 0.5) * 2;
};

const zero = [0, 0, 0] as vec3;
const up = [0, 0, 1] as vec3;
export const deriveViewMatrix = (state: State) => {
	mat4.lookAt(state.viewMatrix, state.camera.eye, zero, up);
};
