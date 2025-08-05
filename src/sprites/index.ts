const imageUrls = {
	walk: new URL(
		`posthog/frontend/public/hedgehog/sprites/skins/default/walk.png`,
		import.meta.url,
	),
	wave: new URL(
		`posthog/frontend/public/hedgehog/sprites/skins/default/wave.png`,
		import.meta.url,
	),
	jump: new URL(
		`posthog/frontend/public/hedgehog/sprites/skins/default/jump.png`,
		import.meta.url,
	),
	cap: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/cap.png`,
		import.meta.url,
	),
	cowboy: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/cowboy.png`,
		import.meta.url,
	),
	sunglasses: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/sunglasses.png`,
		import.meta.url,
	),
	glasses: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/glasses.png`,
		import.meta.url,
	),
	tophat: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/tophat.png`,
		import.meta.url,
	),
	pineapple: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/pineapple.png`,
		import.meta.url,
	),
	party: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/party.png`,
		import.meta.url,
	),
	chef: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/chef.png`,
		import.meta.url,
	),
	parrot: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/parrot.png`,
		import.meta.url,
	),
	beret: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/beret.png`,
		import.meta.url,
	),
	eyepatch: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/eyepatch.png`,
		import.meta.url,
	),
	flag: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/flag.png`,
		import.meta.url,
	),
	graduation: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/graduation.png`,
		import.meta.url,
	),
};

/**
 * count how many sprite the sprite sheet contains:
 * ie which sprite are not transparent in the grid
 */
const countSprites = (() => {
	// const canvas = document.createElement("canvas");
	// canvas.width = 128;
	// canvas.height = 128;
	// canvas.style.position = "absolute";
	// canvas.style.top = "0";
	// canvas.style.width = "100%";
	// document.body.appendChild(canvas);

	const canvas = new OffscreenCanvas(128, 128);
	const ctx = canvas.getContext("2d");

	return (img: CanvasImageSource & { width: number; height: number }) => {
		const downsizedSize = 6;
		const margin = 1;
		const w = Math.ceil((img.width / SOURCE_SIZE) * downsizedSize);
		const h = Math.ceil((img.height / SOURCE_SIZE) * downsizedSize);

		ctx.clearRect(0, 0, w, h);
		ctx.drawImage(img, 0, 0, w, h);
		const imageData = ctx.getImageData(0, 0, w, h);

		let i = 0;
		for (let y = 0; y < img.height / SOURCE_SIZE; y++)
			for (let x = 0; x < img.width / SOURCE_SIZE; x++) {
				let transparent = true;

				for (let dx = margin; dx < downsizedSize - margin; dx++)
					for (let dy = margin; dy < downsizedSize - margin; dy++) {
						const index =
							(y * downsizedSize + dx) * imageData.width +
							(x * downsizedSize + dy);

						const alpha = imageData.data[index * 4 + 3];

						if (alpha > 0) transparent = false;
					}

				if (!transparent) i++;
			}

		return i;
	};
})();

export type Box = [[number, number], [number, number]];

const createShadow = () => {
	const canvas = new OffscreenCanvas(SOURCE_SIZE, SOURCE_SIZE);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "rgba(160, 160, 160, 1)";
	ctx.beginPath();
	ctx.arc(
		SOURCE_SIZE / 2,
		SOURCE_SIZE / 2,
		(SOURCE_SIZE / 2) * 0.9,
		0,
		Math.PI * 2,
	);
	ctx.fill();

	return { image: canvas, name: "shadow", spriteCount: 1 };
};
const createBox = () => {
	const canvas = new OffscreenCanvas(SOURCE_SIZE, SOURCE_SIZE);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "rgba(160, 0, 160, 1)";
	ctx.beginPath();
	ctx.rect(0, 0, SOURCE_SIZE, SOURCE_SIZE);
	ctx.fill();

	return { image: canvas, name: "square", spriteCount: 1 };
};

export const createSpriteAtlas = async () => {
	const images = await Promise.all(
		Object.entries(imageUrls).map(async ([name, url]) => {
			const response = await fetch(url);
			const blob = await response.blob();
			const image = await createImageBitmap(blob);
			const spriteCount = countSprites(image);
			return {
				image: image as ImageBitmap | OffscreenCanvas,
				name,
				spriteCount,
			};
		}),
	);

	images.push(createShadow(), createBox());

	const totalSpriteCount = images.reduce(
		(sum, { spriteCount }) => sum + spriteCount,
		0,
	);

	const destSize = SOURCE_SIZE;

	const canvas = new OffscreenCanvas(destSize * totalSpriteCount, destSize);

	// const canvas = document.createElement("canvas");
	// canvas.width = destSize * totalSpriteCount;
	// canvas.height = destSize;
	// canvas.style.position = "absolute";
	// canvas.style.top = "0";
	// canvas.style.width = "100%";
	// document.body.appendChild(canvas);

	const ctx = canvas.getContext("2d");

	let i = 0;

	const coords: Box[][] = [];

	const animationIndex = {} as AnimationIndex;

	for (const { image, name, spriteCount } of images) {
		animationIndex[name] = coords.length;

		const boxes = [];
		coords.push(boxes);

		let y = 0;
		let x = 0;
		for (let k = spriteCount; k--; ) {
			boxes.push([
				[i / totalSpriteCount, 0],
				[(i + 1) / totalSpriteCount, 1],
			]);

			ctx.drawImage(
				image,
				x * SOURCE_SIZE,
				y * SOURCE_SIZE,
				SOURCE_SIZE,
				SOURCE_SIZE,
				i * destSize,
				0,
				destSize,
				destSize,
			);
			i++;
			x++;
			if (x * SOURCE_SIZE >= image.width) {
				x = 0;
				y++;
			}
		}
	}

	return { texture: canvas, animationIndex, coords };
};

export type AnimationIndex = Record<keyof typeof imageUrls, number> & {
	shadow: number;
	square: number;
};

const SOURCE_SIZE = 80;
