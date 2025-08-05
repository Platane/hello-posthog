import type { AnimationIndex } from "../sprites";
import type { State } from "./state";

export const computeFinalPlacement = (
	game: State,
	animationIndex: AnimationIndex,
	text: string,
) => {
	const canvas = document.createElement("canvas");
	document.body.appendChild(canvas);
	canvas.style.width = "512px";
	canvas.style.height = "128px";
	canvas.style.position = "absolute";
	canvas.style.top = "0";
	canvas.style.left = "0";
	canvas.style.backgroundColor = "#354afe33";
	canvas.width = 1024;
	canvas.height = 256;

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

	for (const runner of game.runners) {
		runner.randomTargetCount = 1;

		let x = 0;
		let y = 0;

		while (imageData.data[(x + y * imageData.width) * 4 + 3] <= 50) {
			x = Math.floor(Math.random() * imageData.width);
			y = Math.floor(Math.random() * imageData.height);
		}

		const k = 20 / imageData.height;
		runner.target[0] = -(x - imageData.width * 0.5) * k;
		runner.target[1] = (y - imageData.height * 0.5) * k;
		runner.randomTargetCount = -1;

		runner.animationIndex = animationIndex.walk;
	}
};
