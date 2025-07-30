import { mat4 } from "gl-matrix";
import { createState, fillSpriteBoxes, init } from "./logic/state";
import { createSpriteRenderer } from "./renderer/spriteRenderer";
import { createSpriteSheet } from "./sprites";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2")!;
const dpr = window.devicePixelRatio ?? 1;
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;

gl.viewport(0, 0, canvas.width, canvas.height);

gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const renderer = createSpriteRenderer(gl);

const viewMatrix = mat4.create() as Float32Array;
mat4.identity(viewMatrix);
mat4.fromScaling(viewMatrix, [0.2, 0.2, 0.2]);
const projectionMatrix = mat4.create() as Float32Array;
mat4.perspective(
	projectionMatrix,
	Math.PI / 4,
	canvas.width / canvas.height,
	0.1,
	1000,
);
mat4.identity(projectionMatrix);

const state = createState();
init(state);

const set = renderer.createSet();

createSpriteSheet().then((res) => {
	renderer.updateSet(set, { colorTexture: res.texture });

	const loop = () => {
		state.time++;
		fillSpriteBoxes(state, res.atlas);
		renderer.updateSet(set, state);

		//

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		renderer.draw(projectionMatrix, viewMatrix, [set]);

		requestAnimationFrame(loop);
	};

	loop();
});
