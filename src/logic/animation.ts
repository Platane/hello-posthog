import type { Box } from "../sprites";
import type { State } from "./state";

export const deriveSpriteBoxesFromAnimations = (
	state: State,
	coords: Box[][],
) => {
	for (let i = state.numInstances; i--; ) {
		const animationIndex = state.animations[i * 3 + 0];
		const animationOffset = state.animations[i * 3 + 1];
		const animationSpeed = state.animations[i * 3 + 2];

		const t = Math.floor(state.time / animationSpeed) + animationOffset;

		const boxes = coords[animationIndex];

		const [min, max] = boxes[t % boxes.length];

		state.spriteBoxes[i * 4 + 0] = min[0];
		state.spriteBoxes[i * 4 + 1] = min[1];
		state.spriteBoxes[i * 4 + 2] = max[0];
		state.spriteBoxes[i * 4 + 3] = max[1];
	}
};
