import { mat4 } from "gl-matrix";
import type { Atlas } from "../sprites";

const MAX_ENTITIES = 512;

export const createState = () => {
	const objectMatrices = new Float32Array(MAX_ENTITIES * 16);
	const objectTransforms = Array.from({ length: MAX_ENTITIES }, (_, i) =>
		objectMatrices.subarray(i * 16, (i + 1) * 16),
	);
	const spriteBoxes = new Float32Array(MAX_ENTITIES * 4);

	for (const m of objectTransforms) mat4.identity(m);

	//  0 -> sprite
	//  1 -> offset
	//  2 -> speed
	const animations = new Uint8Array(MAX_ENTITIES * 3);

	return {
		objectMatrices,
		spriteBoxes,
		objectTransforms,
		animations,
		numInstances: 0,
		time: 0,
	};
};

export type State = ReturnType<typeof createState>;

export const fillSpriteBoxes = (state: State, atlas: Atlas) => {
	for (let i = state.numInstances; i--; ) {
		const t = Math.floor(
			(state.animations[i * 3 + 1] + state.time) / state.animations[i * 3 + 2],
		);
		const [a, b] = atlas.walk[t % atlas.walk.length];

		state.spriteBoxes[i * 4 + 0] = a[0];
		state.spriteBoxes[i * 4 + 1] = a[1];
		state.spriteBoxes[i * 4 + 2] = b[0];
		state.spriteBoxes[i * 4 + 3] = b[1];
	}
};

export const init = (state: State) => {
	const N = 300;
	state.numInstances = N;
	for (let i = N; i--; ) {
		mat4.identity(state.objectTransforms[i]);
		mat4.translate(state.objectTransforms[i], state.objectTransforms[i], [
			(i % 6) - 3,
			Math.floor(i / 6) - 3,
			Math.random(),
		]);

		state.animations[i * 3 + 0] = 0;
		state.animations[i * 3 + 1] = Math.floor(Math.random() * 255);
		state.animations[i * 3 + 2] = 2;
	}
};
