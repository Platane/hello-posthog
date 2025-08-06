import { mat4 } from "gl-matrix";
import {
	deriveViewMatrix,
	stepCameraWobble,
	stepPointerOnGround,
} from "./logic/camera";
import { computeFinalPlacement } from "./logic/computeFinalPlacement";
import { createPhysicStepper, stepRunnerLogic } from "./logic/crowd";
import { stepProgress } from "./logic/progress";
import { deriveSprites } from "./logic/sprites";
import { createState } from "./logic/state";
import { attachUserEvent } from "./logic/userEvent";
import { createSpriteRenderer } from "./renderer/spriteRenderer";
import { createSpriteAtlas } from "./sprites";

const spritePromise = createSpriteAtlas();

const searchParams = new URL(location.href).searchParams;
const message = searchParams.get("message") || "Hello";
const runnerCount = parseInt(searchParams.get("n")) || 2000;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2")!;

gl.disable(gl.CULL_FACE);

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const renderer = createSpriteRenderer(gl);

const set = renderer.createSet();

//
//

const state = createState(runnerCount);
attachUserEvent(state, canvas, gl);
window.dispatchEvent(new Event("resize"));

computeFinalPlacement(state, message);

const stepPhysic = createPhysicStepper(runnerCount);

spritePromise.then((res) => {
	renderer.updateSet(set, { colorTexture: res.texture });

	gl.useProgram(renderer._internal.program);

	gl.uniform1i(renderer._internal.u_colorTexture, 0);
	gl.bindVertexArray(set.vao);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, set.colorTexture);

	const loop = () => {
		state.time++;

		stepPointerOnGround(state);

		stepPhysic(state);
		stepRunnerLogic(state);
		stepCameraWobble(state);
		stepProgress(state);

		deriveSprites(state, res.coords);
		deriveViewMatrix(state);

		//

		renderer.updateSet(set, state);

		//

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//
		// usually the API is meant to call renderer.draw(state.projectionMatrix,state.viewMatrix,[set])
		// but since there is only oone program let's save some gl instructions
		gl.uniformMatrix4fv(
			renderer._internal.u_viewMatrix,
			false,
			state.viewMatrix,
		);
		gl.uniformMatrix4fv(
			renderer._internal.u_projectionMatrix,
			false,
			state.projectionMatrix,
		);

		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, set.numInstances);

		//

		requestAnimationFrame(loop);
	};

	loop();
});
