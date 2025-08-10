import { mat4, quat, vec3 } from "gl-matrix";
import type { Box } from "../sprites";
import { sprite } from "../sprites/type";
import { State } from "./state";

const v = vec3.create();
const q = quat.create();
const s = vec3.create();
export const deriveSprites = (state: State, coords: Record<sprite, Box[]>) => {
	state.runners.sort((a, b) => a.position[1] - b.position[1]);

	let i = 0;

	// shadows
	vec3.set(s, 0.6, 0.6, 0.6);
	quat.identity(q);
	for (const runner of state.runners) {
		const tr = state.objectTransforms[i];
		vec3.set(
			v,
			runner.position[0] + 0.1,
			runner.position[1],
			0 + (i % 500) * 0.0001,
		);
		mat4.fromRotationTranslationScale(tr, q, v, s);

		const [min, max] = coords[sprite.shadow][0];
		state.spriteBoxes[i * 4 + 0] = min[0];
		state.spriteBoxes[i * 4 + 1] = min[1];
		state.spriteBoxes[i * 4 + 2] = max[0];
		state.spriteBoxes[i * 4 + 3] = max[1];

		i++;
	}

	// origin
	{
		// const tr = state.objectTransforms[i];
		// vec3.set(s, 0.5, 0.5, 0.5);
		// mat4.fromScaling(tr, s);
		// const [min, max] = coords[sprite.shadow][0];
		// state.spriteBoxes[i * 4 + 0] = min[0];
		// state.spriteBoxes[i * 4 + 1] = min[1];
		// state.spriteBoxes[i * 4 + 2] = max[0];
		// state.spriteBoxes[i * 4 + 3] = max[1];
		// state.hues[i] = 0;
		// i++;
	}

	// pointer on ground
	{
		const tr = state.objectTransforms[i];
		vec3.set(v, state.pointerOnGround[0], state.pointerOnGround[1], 0);
		mat4.fromTranslation(tr, v);
		mat4.scale(tr, tr, s);
		const [min, max] = coords[sprite.shadow][0];
		state.spriteBoxes[i * 4 + 0] = min[0];
		state.spriteBoxes[i * 4 + 1] = min[1];
		state.spriteBoxes[i * 4 + 2] = max[0];
		state.spriteBoxes[i * 4 + 3] = max[1];

		state.hues[i] = 0.5;

		i++;
	}

	// ground
	{
		const tr = state.objectTransforms[i];
		quat.identity(q);
		vec3.set(s, 200, 200, 200);
		vec3.set(v, 0, 0, -0.05);
		mat4.fromRotationTranslationScale(tr, q, v, s);
		const [min, max] = coords[sprite.whiteSquare][0];
		state.spriteBoxes[i * 4 + 0] = min[0];
		state.spriteBoxes[i * 4 + 1] = min[1];
		state.spriteBoxes[i * 4 + 2] = max[0];
		state.spriteBoxes[i * 4 + 3] = max[1];

		state.hues[i] = 0;

		i++;
	}

	// characters
	for (const runner of state.runners) {
		const tr = state.objectTransforms[i];

		if (Math.abs(runner.velocity[0]) > 0.05)
			runner.spriteDirection = runner.velocity[0] > 0 ? 1 : -1;

		vec3.set(v, runner.position[0], runner.position[1], 0.86);
		vec3.set(s, runner.spriteDirection, 1, 1);
		mat4.fromRotationTranslationScale(tr, q, v, s);
		mat4.rotateX(tr, tr, -Math.PI / 2);

		if (runner.velocity[0] > 0.08) {
			mat4.rotateZ(tr, tr, 0.1);
		}
		if (runner.velocity[0] < -0.08) {
			mat4.rotateZ(tr, tr, 0.1);
		}

		const t =
			runner.animationFrameDuration === 0
				? 0
				: state.time / runner.animationFrameDuration + runner.animationOffset;

		const boxes = coords[runner.animationIndex];

		const [min, max] = boxes[Math.floor(t) % boxes.length];

		state.spriteBoxes[i * 4 + 0] = min[0];
		state.spriteBoxes[i * 4 + 1] = min[1];
		state.spriteBoxes[i * 4 + 2] = max[0];
		state.spriteBoxes[i * 4 + 3] = max[1];

		state.hues[i] = runner.hue;

		i++;

		let dy = 0;
		if (runner.animationIndex === sprite.jump) {
			dy = Math.sin((t / boxes.length + 0.1) * Math.PI * 2) * 0.05;
		}

		for (let j = 0; j < runner.accessories.length; j++) {
			const aTr = state.objectTransforms[i];
			vec3.set(v, 0, dy, 0.01 * (j + 1));
			mat4.translate(aTr, tr, v);

			const accessoryIndex = runner.accessories[j];
			const [min, max] = coords[accessoryIndex][0];
			state.spriteBoxes[i * 4 + 0] = min[0];
			state.spriteBoxes[i * 4 + 1] = min[1];
			state.spriteBoxes[i * 4 + 2] = max[0];
			state.spriteBoxes[i * 4 + 3] = max[1];

			state.hues[i] = 0;

			i++;
		}
	}

	state.numInstances = i;
};
