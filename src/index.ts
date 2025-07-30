import { mat4 } from "gl-matrix";
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

const MAX_ENTITIES = 128;
const objectMatricesFlat = new Float32Array(MAX_ENTITIES * 16);
const objectMatrices = Array.from({ length: MAX_ENTITIES }, (_, i) =>
	objectMatricesFlat.subarray(i * 16, (i + 1) * 16),
);

for (const m of objectMatrices) mat4.identity(m);

mat4.translate(objectMatrices[1], objectMatrices[1], [0, -2, 0]);

mat4.translate(objectMatrices[2], objectMatrices[2], [0.5, 1, 0]);

const set = renderer.createSet();
renderer.updateSet(set, objectMatricesFlat, 3);

const loop = () => {
	mat4.identity(objectMatrices[0]);
	mat4.translate(objectMatrices[0], objectMatrices[0], [2, 0, 0]);
	mat4.rotateZ(objectMatrices[0], objectMatrices[0], Date.now() / 1000);

	renderer.updateSet(set, objectMatricesFlat, 3);

	//

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	renderer.draw(projectionMatrix, viewMatrix, [set]);

	requestAnimationFrame(loop);
};
createSpriteSheet().then((res) => {
	console.log(res);
	loop();
});
