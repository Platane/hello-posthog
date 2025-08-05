import fragmentShaderCode from "./shader.frag?raw";
import vertexShaderCode from "./shader.vert?raw";

export const createSpriteRenderer = (gl: WebGL2RenderingContext) => {
	const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
	gl.shaderSource(vertexShader, vertexShaderCode);
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
		throw "vertex shader error: " + gl.getShaderInfoLog(vertexShader) || "";

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
	gl.shaderSource(fragmentShader, fragmentShaderCode);
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
		throw "fragment shader error: " + gl.getShaderInfoLog(fragmentShader) || "";

	const program = gl.createProgram()!;
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
		throw "Unable to initialize the shader program.";

	const quadBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);

	// interleaved position and texCoord
	const quadData = new Float32Array([
		-1, 1, 0, 1,

		-1, -1, 0, 0,

		1, 1, 1, 1,

		1, -1, 1, 0,
	]);
	gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

	const u_viewMatrix = gl.getUniformLocation(program, "u_viewMatrix");
	const u_colorTexture = gl.getUniformLocation(program, "u_colorTexture");
	const u_projectionMatrix = gl.getUniformLocation(
		program,
		"u_projectionMatrix",
	);

	const a_position = gl.getAttribLocation(program, "a_position");
	const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
	const a_spriteBox = gl.getAttribLocation(program, "a_spriteBox");
	const a_objectMatrix1 = gl.getAttribLocation(program, "a_objectMatrix1");
	const a_objectMatrix2 = gl.getAttribLocation(program, "a_objectMatrix2");
	const a_objectMatrix3 = gl.getAttribLocation(program, "a_objectMatrix3");
	const a_objectMatrix4 = gl.getAttribLocation(program, "a_objectMatrix4");
	const a_hue = gl.getAttribLocation(program, "a_hue");

	const createSet = () => {
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);

		gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
		gl.enableVertexAttribArray(a_position);
		gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0); // read interleaved data, each vertex have 16 bytes ( (2+2) * 4 bytes for float32 ), position offset is 0

		gl.enableVertexAttribArray(a_texCoord);
		gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 16, 8);

		const objectMatricesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, objectMatricesBuffer);
		gl.enableVertexAttribArray(a_objectMatrix1);
		gl.vertexAttribPointer(a_objectMatrix1, 4, gl.FLOAT, false, 16 * 4, 0 * 4);
		gl.vertexAttribDivisor(a_objectMatrix1, 1);
		gl.enableVertexAttribArray(a_objectMatrix2);
		gl.vertexAttribPointer(a_objectMatrix2, 4, gl.FLOAT, false, 16 * 4, 4 * 4);
		gl.vertexAttribDivisor(a_objectMatrix2, 1);
		gl.enableVertexAttribArray(a_objectMatrix3);
		gl.vertexAttribPointer(a_objectMatrix3, 4, gl.FLOAT, false, 16 * 4, 8 * 4);
		gl.vertexAttribDivisor(a_objectMatrix3, 1);
		gl.enableVertexAttribArray(a_objectMatrix4);
		gl.vertexAttribPointer(a_objectMatrix4, 4, gl.FLOAT, false, 16 * 4, 12 * 4);
		gl.vertexAttribDivisor(a_objectMatrix4, 1);

		const spriteBoxBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, spriteBoxBuffer);
		gl.enableVertexAttribArray(a_spriteBox);
		gl.vertexAttribPointer(a_spriteBox, 4, gl.FLOAT, false, 0, 0);
		gl.vertexAttribDivisor(a_spriteBox, 1);

		const hueBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, hueBuffer);
		gl.enableVertexAttribArray(a_hue);
		gl.vertexAttribPointer(a_hue, 1, gl.FLOAT, false, 0, 0);
		gl.vertexAttribDivisor(a_hue, 1);

		const colorTexture = gl.createTexture();

		return {
			vao,
			objectMatricesBuffer,
			spriteBoxBuffer,
			hueBuffer,
			colorTexture,
			numInstances: 0,
		};
	};

	const updateSet = (
		set: ReturnType<typeof createSet>,
		{
			hues,
			objectMatrices,
			spriteBoxes,
			colorTexture,
			numInstances,
		}: {
			hues?: Float32Array;
			objectMatrices?: Float32Array;
			spriteBoxes?: Float32Array;
			colorTexture?: TexImageSource;
			numInstances?: number;
		},
	) => {
		if (numInstances !== undefined) set.numInstances = numInstances;

		if (objectMatrices) {
			gl.bindBuffer(gl.ARRAY_BUFFER, set.objectMatricesBuffer);
			gl.bufferData(
				gl.ARRAY_BUFFER,
				objectMatrices,
				gl.DYNAMIC_DRAW,
				0,
				set.numInstances * 16,
			);
		}

		if (spriteBoxes) {
			gl.bindBuffer(gl.ARRAY_BUFFER, set.spriteBoxBuffer);
			gl.bufferData(
				gl.ARRAY_BUFFER,
				spriteBoxes,
				gl.DYNAMIC_DRAW,
				0,
				set.numInstances * 4,
			);
		}

		if (hues) {
			gl.bindBuffer(gl.ARRAY_BUFFER, set.hueBuffer);
			gl.bufferData(
				gl.ARRAY_BUFFER,
				hues,
				gl.DYNAMIC_DRAW,
				0,
				set.numInstances,
			);
		}

		if (colorTexture) {
			gl.bindTexture(gl.TEXTURE_2D, set.colorTexture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				colorTexture,
			);
			gl.generateMipmap(gl.TEXTURE_2D);
		}
	};

	const draw = (
		projectionMatrix: Float32Array,
		viewMatrix: Float32Array,
		sets: ReturnType<typeof createSet>[],
	) => {
		gl.useProgram(program);

		gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix);
		gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix);
		gl.uniform1i(u_colorTexture, 1); // texture index 1

		for (const { vao, colorTexture, numInstances } of sets) {
			gl.bindVertexArray(vao);

			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, colorTexture);

			gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, numInstances);
		}
	};

	const dispose = () => {
		gl.deleteBuffer(quadBuffer);
		gl.deleteProgram(program);
		gl.deleteShader(fragmentShader);
		gl.deleteShader(vertexShader);
	};

	return { draw, createSet, updateSet, dispose };
};
