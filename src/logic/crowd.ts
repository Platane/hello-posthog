import { mat4, vec2 } from "gl-matrix";
import type { AnimationIndex } from "../sprites";
import { goal, MAX_ENTITIES, type Runner, type State } from "./state";

// acceleration array
const accelerations = Array.from(
	{ length: Math.floor(MAX_ENTITIES / 2) },
	() => new Float32Array(2),
);

export const stepRunnerLogic = (
	state: State,
	animationIndex: AnimationIndex,
) => {
	for (const runner of state.runners) {
		if (runner.goal === goal.idle) {
			if (runner.randomTargetCount === 0) {
				(runner as Runner).goal = goal.goToTarget;
				vec2.copy((runner as any).target, runner.finalTarget);

				// runner.randomTargetCount = -1;

				runner.animationIndex = animationIndex.jump;
				runner.animationFrameDuration = 4;
			} else if (runner.randomTargetCount > 0) {
				(runner as Runner).goal = goal.goToTarget;

				const A = (((1 + Math.random()) / 2) * state.worldSize[0]) / 2;
				const a = Math.random() * Math.PI * 2;
				vec2.set((runner as any).target, Math.sin(a) * A, Math.cos(a) * A);

				runner.randomTargetCount--;

				runner.animationIndex = animationIndex.walk;
				runner.animationFrameDuration = 2;
			} else {
				runner.animationIndex = animationIndex.jump;
				runner.animationFrameDuration = 3;
			}
		}
	}
};

export const stepCrowd = (state: State) => {
	grid.reset(state.worldSize[0] * 1.6, state.worldSize[1] * 1.6);

	//
	// prepare acceleration list
	for (let i = state.runners.length; i--; ) {
		const runner = state.runners[i];

		const a = accelerations[i];
		const v = runner.velocity;
		const p = runner.position;

		//
		// place in grid
		grid.push(p[0], p[1], i);

		//
		// reset acceleration
		a[0] = 0;
		a[1] = 0;

		//
		// friction
		const F_friction = 0.16;
		a[0] += -v[0] * F_friction;
		a[1] += -v[1] * F_friction;

		if (runner.goal !== goal.goToTarget) continue;

		//
		// pointer repulsion
		{
			const ex = p[0] - state.pointerOnGround[0];
			const ey = p[1] - state.pointerOnGround[1];

			const ll = Math.hypot(ex, ey) + 0.00001; // to avoid division by zero

			const F_pointerRepulsion = 0.3;
			const llc = ll + 0.6;
			const ff = F_pointerRepulsion / llc;
			a[0] += (ex / ll) * ff;
			a[1] += (ey / ll) * ff;
		}

		//
		// going forward the target

		const dx = runner.target[0] - p[0];
		const dy = runner.target[1] - p[1];

		const l = Math.hypot(dx, dy);

		if (l < 0.2) {
			p[0] = runner.target[0];
			p[1] = runner.target[1];

			(runner as Runner).goal = goal.idle;

			continue;
		}

		const F_attraction = 0.02;
		a[0] += (dx / l) * F_attraction;
		a[1] += (dy / l) * F_attraction;
	}

	//
	// entities repulsion
	for (const { length, indexes } of grid.cells) {
		for (let i = length; i--; ) {
			const i1 = indexes[i];
			const a1 = accelerations[i1];
			const p1 = state.runners[i1].position;

			for (let j = i; j--; ) {
				const i2 = indexes[j];
				const a2 = accelerations[i2];
				const p2 = state.runners[i2].position;

				const dx = p1[0] - p2[0];
				const dy = p1[1] - p2[1];

				const lSq = dx * dx + dy * dy;
				if (lSq > 5 * 5) continue;
				const l = Math.sqrt(lSq) + 0.00001; // to avoid division by zero

				const F_repulsion = 0.007;
				const lc = l + 0.1;
				const f = F_repulsion / (lc * lc);
				a1[0] += (dx / l) * f;
				a1[1] += (dy / l) * f;

				a2[0] -= (dx / l) * f;
				a2[1] -= (dy / l) * f;
			}
		}
	}

	//
	// apply acceleration
	for (let i = state.runners.length; i--; ) {
		const runner = state.runners[i];

		const a = accelerations[i];
		const v = runner.velocity;
		const p = runner.position;

		v[0] += a[0];
		v[1] += a[1];

		p[0] += v[0];
		p[1] += v[1];
	}
};

/**
 * Create a grid for efficient spatial partitioning
 *
 * To avoid entities close to a cell border not interacting, an entity can be in more than one cell.
 * Which might cause entities to interact twice, which is acceptable.
 */
const createSpacialPartitioningGrid = ({
	width,
	height,
	capacity,
}: {
	width: number;
	height: number;
	capacity: number;
}) => {
	const margin = 1;

	const cells = Array.from({ length: width * height }, () => ({
		length: 0,
		indexes: new Uint16Array(capacity),
	}));
	const mod = (n: number, m: number) => ((n % m) + m) % m;

	let gridCellWidth = 1;
	let gridCellHeight = 1;

	// add an offset that varies every frame, so the grid border is not always at the same position
	let offset = 0;

	const reset = (worldWidth: number, worldHeight: number) => {
		gridCellWidth = worldWidth / width;
		gridCellHeight = worldHeight / height;
		offset = Math.random() * 4;
		for (const c of cells) c.length = 0;
	};
	const push = (x: number, y: number, i: number) => {
		const h =
			mod(Math.floor((x + offset) / gridCellWidth), width) +
			mod(Math.floor((y + offset) / gridCellHeight), height) * width;

		const cell = cells[h];
		cell.indexes[cell.length] = i;
		cell.length++;

		const hx =
			mod(Math.floor((x + offset + margin) / gridCellWidth), width) +
			mod(Math.floor((y + offset) / gridCellHeight), height) * width;

		if (hx !== h) {
			const cell = cells[hx];
			cell.indexes[cell.length] = i;
			cell.length++;
		}

		const hy =
			mod(Math.floor((x + offset) / gridCellWidth), width) +
			mod(Math.floor((y + offset + margin) / gridCellHeight), height) * width;

		if (hy !== h) {
			const cell = cells[hy];
			cell.indexes[cell.length] = i;
			cell.length++;
		}
	};
	return { reset, push, cells };
};

const grid = createSpacialPartitioningGrid({
	width: 20,
	height: 6,
	capacity: Math.floor(MAX_ENTITIES / 4),
});
