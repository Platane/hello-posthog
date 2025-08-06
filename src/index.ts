import { mat4 } from "gl-matrix";
import {
	deriveViewMatrix,
	stepCameraWobble,
	stepPointerOnGround,
} from "./logic/camera";
import { computeFinalPlacement } from "./logic/computeFinalPlacement";
import { stepCrowd, stepRunnerLogic } from "./logic/crowd";
import { stepProgress } from "./logic/progress";
import { deriveSprites } from "./logic/sprites";
import { createState, setInitialState } from "./logic/state";
import { attachUserEvent } from "./logic/userEvent";
import { createSpriteRenderer } from "./renderer/spriteRenderer";
import { createSpriteAtlas } from "./sprites";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2")!;
const dpr = window.devicePixelRatio ?? 1;

gl.disable(gl.CULL_FACE);

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const renderer = createSpriteRenderer(gl);

const state = createState();
const resize = () => {
	canvas.width = canvas.clientWidth * dpr;
	canvas.height = canvas.clientHeight * dpr;

	gl.viewport(0, 0, canvas.width, canvas.height);

	const aspect = canvas.width / canvas.height;
	mat4.perspective(
		state.projectionMatrix,
		Math.PI / 4 / aspect,
		aspect,
		0.1,
		2000,
	);
};
resize();

window.addEventListener("resize", resize);
attachUserEvent(state);

const set = renderer.createSet();
const sets = [set];

createSpriteAtlas().then((res) => {
	const searchParams = new URL(location.href).searchParams;
	const message = searchParams.get("message") || "Hello";
	const entityCount = parseInt(searchParams.get("n")) || 800;

	renderer.updateSet(set, { colorTexture: res.texture });
	setInitialState(state, res.animationIndex, entityCount);
	computeFinalPlacement(state, res.animationIndex, message);

	const loop = () => {
		state.time++;

		stepPointerOnGround(state);

		stepCrowd(state);
		stepRunnerLogic(state, res.animationIndex);
		stepCameraWobble(state);
		stepProgress(state);

		deriveSprites(state, res.animationIndex, res.coords);
		deriveViewMatrix(state);

		//

		renderer.updateSet(set, state);

		//

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		renderer.draw(state.projectionMatrix, state.viewMatrix, sets);

		//

		requestAnimationFrame(loop);
	};

	loop();
});
