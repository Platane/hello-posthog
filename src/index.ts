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
import {
	createDepthOfFieldPassRenderer,
	createFrameBuffer,
} from "./renderer/depthOfFieldPass/renderer";
import { createSpriteRenderer } from "./renderer/sprite/spriteRenderer";
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

const rendererSprite = createSpriteRenderer(gl);
const rendererBlurPass = createDepthOfFieldPassRenderer(gl);

const set = rendererSprite.createSet();

let fbo = createFrameBuffer(gl);

//
//

const state = createState(runnerCount);
attachUserEvent(state);
computeFinalPlacement(state, message);
const stepPhysic = createPhysicStepper(runnerCount);

//
//

const resize = () => {
	const dpr = window.devicePixelRatio ?? 1;

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

	fbo.dispose();
	fbo = createFrameBuffer(gl);

	rendererBlurPass.resize();
};

window.addEventListener("resize", resize);
resize();

//
//

spritePromise.then((res) => {
	rendererSprite.updateSet(set, { colorTexture: res.texture });

	gl.useProgram(rendererSprite._internal.program);

	gl.uniform1i(rendererSprite._internal.u_colorTexture, 0);
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

		rendererSprite.updateSet(set, state);

		//

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		rendererSprite.draw(state.projectionMatrix, state.viewMatrix, [set]);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		const l = Math.hypot(
			state.camera.eye[0],
			state.camera.eye[1],
			state.camera.eye[2],
		);
		rendererBlurPass.draw(fbo.colorTexture, fbo.depthTexture, {
			near: 0.1,
			far: 2000,
			depthFocus: l,
			depthFocusSpread: l / 0.5,
		});

		//

		requestAnimationFrame(loop);
	};

	loop();
});
