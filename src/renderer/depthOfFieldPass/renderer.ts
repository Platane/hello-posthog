import vertexShaderCode from "./shader.vert?raw";
import fragmentShaderCodeBlur from "./shader-blur.frag?raw";
import fragmentShaderCodeComposition from "./shader-composition.frag?raw";

export const createDepthOfFieldPassRenderer = (gl: WebGL2RenderingContext) => {
	const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
	gl.shaderSource(vertexShader, vertexShaderCode);
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
		throw "vertex shader error: " + gl.getShaderInfoLog(vertexShader) || "";

	const fragmentShaderBlur = gl.createShader(gl.FRAGMENT_SHADER)!;
	gl.shaderSource(fragmentShaderBlur, fragmentShaderCodeBlur);
	gl.compileShader(fragmentShaderBlur);
	if (!gl.getShaderParameter(fragmentShaderBlur, gl.COMPILE_STATUS))
		throw (
			"fragment shader error: " + gl.getShaderInfoLog(fragmentShaderBlur) || ""
		);

	const fragmentShaderComposition = gl.createShader(gl.FRAGMENT_SHADER)!;
	gl.shaderSource(fragmentShaderComposition, fragmentShaderCodeComposition);
	gl.compileShader(fragmentShaderComposition);
	if (!gl.getShaderParameter(fragmentShaderComposition, gl.COMPILE_STATUS))
		throw (
			"fragment shader error: " +
				gl.getShaderInfoLog(fragmentShaderComposition) || ""
		);

	const programBlur = gl.createProgram()!;
	gl.attachShader(programBlur, vertexShader);
	gl.attachShader(programBlur, fragmentShaderBlur);

	gl.linkProgram(programBlur);

	if (!gl.getProgramParameter(programBlur, gl.LINK_STATUS))
		throw "Unable to initialize the shader program.";

	const programComposition = gl.createProgram()!;
	gl.attachShader(programComposition, vertexShader);
	gl.attachShader(programComposition, fragmentShaderComposition);

	gl.linkProgram(programComposition);

	if (!gl.getProgramParameter(programComposition, gl.LINK_STATUS))
		throw "Unable to initialize the shader program.";

	const quadBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
		gl.STATIC_DRAW,
	);

	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const a_position = gl.getAttribLocation(programBlur, "a_position");
	gl.enableVertexAttribArray(a_position);
	gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

	const blurUniforms = {
		u_colorTexture: gl.getUniformLocation(programBlur, "u_colorTexture"),
	};
	const compositionUniforms = {
		u_parameters: gl.getUniformLocation(programComposition, "u_parameters"),
		u_colorTexture: gl.getUniformLocation(programComposition, "u_colorTexture"),
		u_depthTexture: gl.getUniformLocation(programComposition, "u_depthTexture"),
		u_blurredTexture: gl.getUniformLocation(
			programComposition,
			"u_blurredTexture",
		),
	};

	const withEffect = (
		{
			near,
			far,
			depthFocus,
			depthFocusSpread,
		}: {
			near: number;
			far: number;
			depthFocus: number;
			depthFocusSpread: number;
		},
		draw: () => void,
	) => {
		gl.enable(gl.DEPTH_TEST);
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferScene);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		draw();

		gl.activeTexture(gl.TEXTURE0 + 1);
		gl.bindTexture(gl.TEXTURE_2D, colorTextureScene);
		gl.activeTexture(gl.TEXTURE0 + 2);
		gl.bindTexture(gl.TEXTURE_2D, depthTextureScene);
		gl.activeTexture(gl.TEXTURE0 + 3);
		gl.bindTexture(gl.TEXTURE_2D, colorTextureBlur);

		gl.disable(gl.DEPTH_TEST);
		gl.bindVertexArray(vao);

		gl.useProgram(programBlur);

		gl.uniform1i(blurUniforms.u_colorTexture, 1);

		gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferBlur);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		gl.useProgram(programComposition);

		gl.uniform1i(compositionUniforms.u_colorTexture, 1);
		gl.uniform1i(compositionUniforms.u_depthTexture, 2);
		gl.uniform1i(compositionUniforms.u_blurredTexture, 3);

		gl.uniform4f(
			compositionUniforms.u_parameters,
			near,
			far,
			depthFocus,
			depthFocusSpread,
		);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	};

	let colorTextureScene = gl.createTexture();
	let depthTextureScene = gl.createTexture();
	let framebufferScene = gl.createFramebuffer();

	let colorTextureBlur = gl.createTexture();
	let framebufferBlur = gl.createFramebuffer();

	const resize = () => {
		gl.deleteTexture(colorTextureBlur);
		colorTextureBlur = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, colorTextureBlur);
		gl.texStorage2D(
			gl.TEXTURE_2D,
			1,
			gl.RGBA8,
			gl.drawingBufferWidth,
			gl.drawingBufferHeight,
		);

		gl.deleteFramebuffer(framebufferBlur);
		framebufferBlur = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferBlur);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			colorTextureBlur,
			0,
		);

		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

		gl.deleteTexture(colorTextureScene);
		colorTextureScene = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, colorTextureScene);
		gl.texStorage2D(
			gl.TEXTURE_2D,
			1,
			gl.RGBA8,
			gl.drawingBufferWidth,
			gl.drawingBufferHeight,
		);

		gl.deleteTexture(depthTextureScene);
		depthTextureScene = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, depthTextureScene);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texStorage2D(
			gl.TEXTURE_2D,
			1,
			gl.DEPTH24_STENCIL8,
			gl.drawingBufferWidth,
			gl.drawingBufferHeight,
		);

		gl.deleteFramebuffer(framebufferScene);
		framebufferScene = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferScene);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			colorTextureScene,
			0,
		);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.DEPTH_ATTACHMENT,
			gl.TEXTURE_2D,
			depthTextureScene,
			0,
		);

		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
	};

	const dispose = () => {
		gl.deleteTexture(colorTextureBlur);
		gl.deleteFramebuffer(framebufferBlur);
		gl.deleteTexture(colorTextureScene);
		gl.deleteTexture(depthTextureScene);
		gl.deleteFramebuffer(framebufferScene);

		gl.deleteBuffer(quadBuffer);
		gl.deleteProgram(programBlur);
	};

	return { program: programBlur, withEffect, resize, dispose };
};
