import { mat4, type vec3 } from "gl-matrix";
import { AnimationIndex } from "../sprites";

const MAX_ENTITIES = 128;

export const createState = () => {
	const objectMatrices = new Float32Array(MAX_ENTITIES * 16);
	const objectTransforms = Array.from({ length: MAX_ENTITIES }, (_, i) =>
		objectMatrices.subarray(i * 16, (i + 1) * 16),
	);
	const spriteBoxes = new Float32Array(MAX_ENTITIES * 4);

	//  0 -> sprite
	//  1 -> offset
	//  2 -> speed
	const animations = new Uint8Array(MAX_ENTITIES * 3);

	const directions = new Float32Array(MAX_ENTITIES * 2);

	const velocities = new Float32Array(MAX_ENTITIES * 2);

	const targets = new Float32Array(MAX_ENTITIES * 2);

	const viewMatrix = mat4.create() as Float32Array;
	const projectionMatrix = mat4.create() as Float32Array;

	return {
		camera: { eye: [0, 4, 4] as vec3 },
		viewMatrix,
		projectionMatrix,
		targets,
		objectMatrices,
		spriteBoxes,
		objectTransforms,
		animations,
		directions,
		velocities,
		numInstances: 0,
		numRunners: 0,
		time: 0,
		pointer: { x: 0, y: 0, down: false },
	};
};

export type State = ReturnType<typeof createState>;

export const setInitialState = (
	state: State,
	animationIndex: AnimationIndex,
) => {
	const accessoriesIndex = [
		animationIndex.cap,
		animationIndex.chef,
		animationIndex.cowboy,
		animationIndex.glasses,
		animationIndex.tophat,
		animationIndex.party,
		animationIndex.pineapple,
		animationIndex.sunglasses,
	];

	const N = 12;
	state.numRunners = N;
	state.numInstances = N * 3;
	for (let i = N; i--; ) {
		mat4.fromTranslation(state.objectTransforms[i], [
			(Math.random() * 2 - 1) * 4,
			(Math.random() * 2 - 1) * 4,
			0,
		]);

		state.animations[i * 3 + 0] = animationIndex.walk;
		state.animations[i * 3 + 1] = Math.floor(Math.random() * 255); // offset
		state.animations[i * 3 + 2] = 2; // speed

		state.targets[i * 2 + 0] = (Math.random() * 2 - 1) * 4;
		state.targets[i * 2 + 1] = (Math.random() * 2 - 1) * 4;

		// shadows
		state.animations[N * 3 + i * 3 + 0] = animationIndex.shadow;
		state.animations[N * 3 + i * 3 + 1] = 0; // offset
		state.animations[N * 3 + i * 3 + 2] = 0; // speed

		// accessories
		state.animations[N * 3 * 2 + i * 3 + 0] =
			accessoriesIndex[Math.floor(Math.random() * accessoriesIndex.length)];
		state.animations[N * 3 * 2 + i * 3 + 1] = 0; // offset
		state.animations[N * 3 * 2 + i * 3 + 2] = 0; // speed
	}
};
