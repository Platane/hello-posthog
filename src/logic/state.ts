import { mat4, vec2, vec3 } from "gl-matrix";
import { sprite } from "../sprites/type";

export const createState = (n: number) => {
	const viewMatrix = mat4.create() as Float32Array;
	const projectionMatrix = mat4.create() as Float32Array;

	const runners = generateRunners(n);

	const numInstances = runners.reduce(
		(sum, r) => sum + r.accessories.length + 1 + 1,
		3,
	);

	const objectMatrices = new Float32Array(numInstances * 16);
	const objectTransforms = Array.from({ length: numInstances }, (_, i) =>
		objectMatrices.subarray(i * 16, (i + 1) * 16),
	);
	const spriteBoxes = new Float32Array(numInstances * 4);
	const hues = new Float32Array(numInstances);

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

		runners,
	};
};

export type Runner = {
	hue: number;
	position: vec2;
	velocity: vec2;
	spriteDirection: 1 | -1;
} & {
	accessories: number[];
} & WithGoal &
	Animated &
	WithFinalGoal;

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

export type State = ReturnType<typeof createState>;

export const generateRunners = (count: number) => {
	const hats = [
		sprite.cap,
		sprite.chef,
		sprite.cowboy,
		sprite.tophat,
		sprite.party,
		sprite.pineapple,
		sprite.beret,
		sprite.flag,
		sprite.graduation,
	];
	const faceAccessories = [
		//
		sprite.glasses,
		sprite.sunglasses,
		sprite.eyepatch,
	];

	const s = Math.sqrt(count) * 1.6;
	return Array.from({ length: count }, () => {
		const accessories: number[] = [];

		const a1 = hats[Math.floor(Math.random() * (hats.length + 2))];
		const a2 =
			faceAccessories[Math.floor(Math.random() * (faceAccessories.length + 6))];

		if (a1 !== undefined) accessories.push(a1);
		if (a2 !== undefined) accessories.push(a2);

		return {
			position: [
				(Math.random() * 2 - 1) * s - s * 1.6,
				(Math.random() * 2 - 1) * s * 0.6,
			],
			velocity: [0, 0],
			animationIndex: sprite.walk,
			animationOffset: Math.floor(Math.random() * 10),
			animationFrameDuration: 2,
			accessories,
			finalTarget: [0, 0],
			randomTargetCount: 4,
			goal: goal.idle,
			spriteDirection: 1,
			hue: Math.random(),
			...{ target: [0, 0] },
		} as Runner;
	});
};
