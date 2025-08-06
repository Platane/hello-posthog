import { sprite } from "../sprites/type";
import type { State } from "./state";

export const computeFinalPlacement = (game: State, text: string) => {
	const canvas = new OffscreenCanvas(1024, 256);
	// const canvas = document.createElement("canvas");
	// document.body.appendChild(canvas);
	// canvas.style.width = "512px";
	// canvas.style.height = "128px";
	// canvas.style.position = "absolute";
	// canvas.style.top = "0";
	// canvas.style.left = "0";
	// canvas.style.backgroundColor = "#354afe33";
	// canvas.width = 1024;
	// canvas.height = 256;

	const ctx = canvas.getContext("2d")!;
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	ctx.scale(1, 2);
	ctx.font = `bolder ${canvas.height * 0.65}px Arial`;
	ctx.letterSpacing = canvas.height * 0.06 + "px";

	ctx.filter = "blur(2px)";

	const x = canvas.width / 2;
	const y = canvas.height / 1.65 / 2;
	ctx.fillStyle = "#888";
	ctx.fillText(text, x, y, canvas.width);

	ctx.lineWidth = canvas.height * 0.02;
	ctx.strokeStyle = "#000";
	ctx.strokeText(text, x, y, canvas.width);

	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	const cells: { x: number; y: number }[] = [];
	for (let x = imageData.width; x--; )
		for (let y = imageData.height; y--; )
			if (imageData.data[(x + y * imageData.width) * 4 + 3] > 10)
				cells.push({
					x: -(x - imageData.width * 0.5),
					y: y - imageData.height * 0.5,
				});

	const density = 0.5; // in entity per world unit square

	// density = N_Runner / area
	// density = N_Runner / ( N_cells * cellSize² )
	const s = Math.sqrt(game.runners.length / (density * cells.length));

	for (const runner of game.runners) {
		const { x, y } = cells[Math.floor(Math.random() * cells.length)];

		runner.finalTarget[0] = (x + Math.random()) * s;
		runner.finalTarget[1] = (y + Math.random()) * s;
		runner.randomTargetCount = 1;

		runner.animationIndex = sprite.walk;
		runner.animationFrameDuration = 3;
	}

	let maxX = 0;
	let maxY = 0;
	for (const { x, y } of cells) {
		maxX = Math.max(maxX, (x + 1) * s);
		maxY = Math.max(maxY, (y + 1) * s);
	}

	game.worldSize[0] = maxX * 2;
	game.worldSize[1] = maxY * 2;
};
