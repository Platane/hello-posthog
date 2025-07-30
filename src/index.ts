import { mat4 } from "gl-matrix";
import { createSpriteRenderer } from "./renderer/spriteRenderer";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2")!;
const dpr = window.devicePixelRatio ?? 1;
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;

gl.viewport(0, 0, canvas.width, canvas.height);

const renderer = createSpriteRenderer(gl);

const viewMatrix = mat4.create() as Float32Array;
mat4.identity(viewMatrix);

const loop = () => {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	renderer.draw(viewMatrix);

	requestAnimationFrame(loop);
};
loop();
