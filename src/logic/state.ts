import { mat4, vec2, vec3 } from "gl-matrix";
import type { AnimationIndex } from "../sprites";

export const MAX_ENTITIES = 8_000;

export const createState = () => {
	const objectMatrices = new Float32Array(MAX_ENTITIES * 16);
	const objectTransforms = Array.from({ length: MAX_ENTITIES }, (_, i) =>
		objectMatrices.subarray(i * 16, (i + 1) * 16),
	);
	const spriteBoxes = new Float32Array(MAX_ENTITIES * 4);
	const hues = new Float32Array(MAX_ENTITIES);

	const viewMatrix = mat4.create() as Float32Array;
	const projectionMatrix = mat4.create() as Float32Array;

	return {
		time: 0,
		pointer: { x: 0.5, y: 0.1, down: false },
		pointerOnGround: [0, 0] as vec2,
		zoom: 0.9,

		worldSize: [1, 1] as vec2,

		camera: { eye: [0, 4, 4] as vec3 },
		viewMatrix,
		projectionMatrix,

		objectMatrices,
		hues,
		spriteBoxes,
		objectTransforms,
		numInstances: 0,

		runners: [] as Runner[],
	};
};
export enum goal {
	idle,
	resting,
	goToTarget,
}
type WithGoal =
	| {
			goal: goal.idle;
	  }
	| {
			goal: goal.goToTarget;
			target: vec2;
	  }
	| {
			goal: goal.resting;
			remainingTimeResting: number;
	  };
type WithFinalGoal = {
	finalTarget: vec2;
	randomTargetCount: number;
};
type Animated = {
	animationIndex: number;
	animationOffset: number;
	animationFrameDuration: number;
};
export type Runner = {
	hue: number;
	position: vec2;
	velocity: vec2;
	spriteDirection: 1 | -1;
} & WithGoal &
	Animated &
	WithFinalGoal & {
		accessories: number[];
	};

export type State = ReturnType<typeof createState>;

export const setInitialState = (
	state: State,
	animationIndex: AnimationIndex,
	entityCount: number,
) => {
	const hats = [
		animationIndex.cap,
		animationIndex.chef,
		animationIndex.cowboy,
		animationIndex.tophat,
		animationIndex.party,
		animationIndex.pineapple,
		animationIndex.beret,
		animationIndex.flag,
		animationIndex.graduation,
	];
	const faceAccessories = [
		animationIndex.glasses,
		animationIndex.sunglasses,
		animationIndex.eyepatch,
	];

	for (let i = entityCount; i--; ) {
		const accessories: number[] = [];

		const a1 = hats[Math.floor(Math.random() * (hats.length + 2))];
		const a2 =
			faceAccessories[Math.floor(Math.random() * (faceAccessories.length + 6))];

		if (a1 !== undefined) accessories.push(a1);
		if (a2 !== undefined) accessories.push(a2);

		state.runners.push({
			position: [
				(Math.random() * 2 - 1) * 20 - 40,
				(Math.random() * 2 - 1) * 20,
			],
			velocity: [0, 0],
			animationIndex: animationIndex.walk,
			animationOffset: Math.floor(Math.random() * 10),
			animationFrameDuration: 2,
			accessories,
			finalTarget: [0, 0],
			randomTargetCount: 4,
			goal: goal.idle,
			spriteDirection: 1,
			hue: Math.random(),
			...{ target: [0, 0] },
		});
	}
};
