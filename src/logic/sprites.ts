import { mat4, quat, quat2, vec2, vec3 } from "gl-matrix";
import type { AnimationIndex, Box } from "../sprites";
import { State } from "./state";

const v = vec3.create();
const q = quat.create();
const s = vec3.create();
export const deriveSprites = (
	state: State,
	animationIndex: AnimationIndex,
	coords: Box[][],
) => {
	state.runners.sort((a, b) => a.position[1] - b.position[1]);

	let i = 0;

	// shadows
	vec3.set(s, 0.6, 0.6, 0.6);
	quat.identity(q);
	for (const runner of state.runners) {
		const tr = state.objectTransforms[i];
		vec3.set(v, runner.position[0] + 0.1, runner.position[1], -0.84 + i / 1000);
		mat4.fromRotationTranslationScale(tr, q, v, s);

		const [min, max] = coords[animationIndex.shadow][0];
		state.spriteBoxes[i * 4 + 0] = min[0];
		state.spriteBoxes[i * 4 + 1] = min[1];
		state.spriteBoxes[i * 4 + 2] = max[0];
		state.spriteBoxes[i * 4 + 3] = max[1];

		i++;
	}

	// characters
	for (const runner of state.runners) {
		const tr = state.objectTransforms[i];

		vec3.set(v, runner.position[0], runner.position[1], 0);
		vec3.set(s, runner.velocity[0] > 0 ? 1 : -1, 1, 1);
		mat4.fromRotationTranslationScale(tr, q, v, s);
		mat4.rotateX(tr, tr, -Math.PI / 2);

		if (runner.velocity[0] > 0.8) {
			mat4.rotateZ(tr, tr, 0.1);
		}
		if (runner.velocity[0] < -0.8) {
			mat4.rotateZ(tr, tr, 0.1);
		}

		const t =
			runner.animationSpeed === 0
				? 0
				: Math.floor(state.time / runner.animationSpeed) +
					runner.animationOffset;

		const boxes = coords[runner.animationIndex];

		const [min, max] = boxes[t % boxes.length];

		state.spriteBoxes[i * 4 + 0] = min[0];
		state.spriteBoxes[i * 4 + 1] = min[1];
		state.spriteBoxes[i * 4 + 2] = max[0];
		state.spriteBoxes[i * 4 + 3] = max[1];

		i++;

		for (let j = 0; j < runner.accessories.length; j++) {
			const aTr = state.objectTransforms[i];
			vec3.set(v, 0, 0, 0.01 * (j + 1));
			mat4.translate(aTr, tr, v);

			const accessoryIndex = runner.accessories[j];
			const [min, max] = coords[accessoryIndex][0];
			state.spriteBoxes[i * 4 + 0] = min[0];
			state.spriteBoxes[i * 4 + 1] = min[1];
			state.spriteBoxes[i * 4 + 2] = max[0];
			state.spriteBoxes[i * 4 + 3] = max[1];

			i++;
		}

		// accessory
		// const accTr = state.objectTransforms[state.numRunners * 2 + i];
		// mat4.identity(accTr);
		// mat4.translate(accTr, accTr, [x, y + 0.05, 0]);
		// mat4.scale(accTr, accTr, [vx > 0 ? 1 : -1, 1, 1]);
		// mat4.rotateX(accTr, accTr, -Math.PI / 2);
	}

	state.numInstances = i;
};
