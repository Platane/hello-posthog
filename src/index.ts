import { mat4 } from "gl-matrix";
import { deriveSpriteBoxesFromAnimations } from "./logic/animation";
import { deriveViewMatrix, stepCameraWobble } from "./logic/camera";
import { deriveTransform, stepCrowd } from "./logic/crowd";
import { createState, setInitialState } from "./logic/state";
import { createSpriteRenderer } from "./renderer/spriteRenderer";
import { createSpriteAtlas } from "./sprites";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2")!;
const dpr = window.devicePixelRatio ?? 1;

gl.disable(gl.CULL_FACE);
// gl.enable(gl.CULL_FACE);
// gl.cullFace(gl.BACK);

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

	mat4.perspective(
		state.projectionMatrix,
		Math.PI / 4,
		canvas.width / canvas.height,
		0.1,
		2000,
	);
};
window.addEventListener("resize", resize);
resize();

window.addEventListener("mousemove", (e) => {
	state.pointer.x = e.clientX / window.innerWidth;
	state.pointer.y = e.clientY / window.innerHeight;
});

const set = renderer.createSet();
const sets = [set];

createSpriteAtlas().then((res) => {
	renderer.updateSet(set, { colorTexture: res.texture });
	setInitialState(state, res.animationIndex);

	const loop = () => {
		state.time++;

		stepCrowd(state, res.animationIndex);
		stepCameraWobble(state);

		deriveTransform(state);
		deriveViewMatrix(state);
		deriveSpriteBoxesFromAnimations(state, res.coords);

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
