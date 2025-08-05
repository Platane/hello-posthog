import { mat4, vec2, type vec3 } from "gl-matrix";
import type { AnimationIndex } from "../sprites";

const MAX_ENTITIES = 10_000;

export const createState = () => {
	const objectMatrices = new Float32Array(MAX_ENTITIES * 16);
	const objectTransforms = Array.from({ length: MAX_ENTITIES }, (_, i) =>
		objectMatrices.subarray(i * 16, (i + 1) * 16),
	);
	const spriteBoxes = new Float32Array(MAX_ENTITIES * 4);

	const viewMatrix = mat4.create() as Float32Array;
	const projectionMatrix = mat4.create() as Float32Array;

	return {
		time: 0,
		pointer: { x: 0, y: 0, down: false },

		camera: { eye: [0, 4, 4] as vec3 },
		viewMatrix,
		projectionMatrix,

		objectMatrices,
		spriteBoxes,
		objectTransforms,
		numInstances: 0,

		runners: [] as {
			position: vec2;
			velocity: vec2;
			direction: vec2;
			target: vec2;
			finalTarget: vec2;
			randomTargetCount: number;
			animationIndex: number;
			animationOffset: number;
			animationSpeed: number;
			accessories: number[];
		}[],
	};
};

export type State = ReturnType<typeof createState>;

export const setInitialState = (
	state: State,
	animationIndex: AnimationIndex,
) => {
	const accessoriesIndex1 = [
		animationIndex.cap,
		animationIndex.chef,
		animationIndex.cowboy,
		animationIndex.tophat,
		animationIndex.party,
		animationIndex.pineapple,
	];
	const accessoriesIndex2 = [animationIndex.glasses, animationIndex.sunglasses];

	const N = 400;
	for (let i = N; i--; ) {
		const accessories: number[] = [];

		const a1 =
			accessoriesIndex1[
				Math.floor(Math.random() * (accessoriesIndex1.length + 2))
			];
		const a2 =
			accessoriesIndex2[
				Math.floor(Math.random() * (accessoriesIndex2.length + 6))
			];

		if (a1 !== undefined) accessories.push(a1);
		if (a2 !== undefined) accessories.push(a2);

		state.runners.push({
			position: [(Math.random() * 2 - 1) * 10, (Math.random() * 2 - 1) * 10],
			velocity: [0, 0],
			direction: [1, 0],
			target: [0, 0],
			animationIndex: animationIndex.walk,
			animationOffset: Math.floor(Math.random() * 10),
			animationSpeed: 2,
			accessories,
			finalTarget: [0, 0],
			randomTargetCount: 4,
		});
	}
};
