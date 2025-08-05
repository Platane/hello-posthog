import { mat4, vec3 } from "gl-matrix";
import type { State } from "./state";

export const stepCameraWobble = (state: State) => {
	const phi = Math.PI / 7 + ((0.5 - state.pointer.y) * Math.PI) / 24;
	const theta = (state.pointer.x - 0.5) * 0.3;

	const minRadius = 12;
	const maxRadius = Math.max(state.worldSize[0] * 1.5, 18);

	const radius =
		minRadius + (maxRadius - minRadius) * (state.zoom * state.zoom);

	state.camera.eye[0] = radius * Math.sin(theta) * Math.cos(phi);
	state.camera.eye[1] = radius * Math.cos(theta) * Math.cos(phi);
	state.camera.eye[2] = radius * Math.sin(phi);
};

const zero = [0, 0, 0] as vec3;
const up = [0, 0, 1] as vec3;
export const deriveViewMatrix = (state: State) => {
	mat4.lookAt(state.viewMatrix, state.camera.eye, zero, up);
};

const worldMatrixInv = mat4.create();
const v = vec3.create();
export const stepPointerOnGround = (state: State) => {
	mat4.multiply(worldMatrixInv, state.projectionMatrix, state.viewMatrix);
	mat4.invert(worldMatrixInv, worldMatrixInv);

	vec3.set(v, state.pointer.x * 2 - 1, -(state.pointer.y * 2 - 1), 0.5);
	vec3.transformMat4(v, v, worldMatrixInv);

	vec3.sub(v, v, state.camera.eye);
	vec3.normalize(v, v);

	const t = -state.camera.eye[2] / v[2];

	state.pointerOnGround[0] = state.camera.eye[0] + v[0] * t;
	state.pointerOnGround[1] = state.camera.eye[1] + v[1] * t;
};
