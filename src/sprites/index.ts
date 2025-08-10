import { sprite } from "./type";

const SOURCE_SIZE = 80;

const createShadowSpriteSheet = () => {
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

	return canvas;
};

const imageUrls = {
	[sprite.walk]: new URL(
		`posthog/frontend/public/hedgehog/sprites/skins/default/walk.png`,
		import.meta.url,
	),
	[sprite.wave]: new URL(
		`posthog/frontend/public/hedgehog/sprites/skins/default/wave.png`,
		import.meta.url,
	),
	[sprite.jump]: new URL(
		`posthog/frontend/public/hedgehog/sprites/skins/default/jump.png`,
		import.meta.url,
	),
	[sprite.cap]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/cap.png`,
		import.meta.url,
	),
	[sprite.cowboy]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/cowboy.png`,
		import.meta.url,
	),
	[sprite.sunglasses]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/sunglasses.png`,
		import.meta.url,
	),
	[sprite.glasses]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/glasses.png`,
		import.meta.url,
	),
	[sprite.tophat]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/tophat.png`,
		import.meta.url,
	),
	[sprite.pineapple]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/pineapple.png`,
		import.meta.url,
	),
	[sprite.party]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/party.png`,
		import.meta.url,
	),
	[sprite.chef]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/chef.png`,
		import.meta.url,
	),
	[sprite.parrot]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/parrot.png`,
		import.meta.url,
	),
	[sprite.beret]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/beret.png`,
		import.meta.url,
	),
	[sprite.eyepatch]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/eyepatch.png`,
		import.meta.url,
	),
	[sprite.flag]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/flag.png`,
		import.meta.url,
	),
	[sprite.graduation]: new URL(
		`posthog/frontend/public/hedgehog/sprites/accessories/graduation.png`,
		import.meta.url,
	),
	[sprite.shadow]: createShadowSpriteSheet(),
} satisfies Record<sprite, unknown>;

/**
 * count how many sprite the sprite sheet contains:
 * ie which sprite are not transparent in the grid
 */
const countSprites = (() => {
	const canvas = new OffscreenCanvas(128, 128);
	const ctx = canvas.getContext("2d");

	return (img: CanvasImageSource & { width: number; height: number }) => {
		const downsizedSize = 8;
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

export const createSpriteAtlas = async () => {
	const images = await Promise.all(
		Object.entries(imageUrls).map(async ([name, urlOrImage]) => {
			let image: ImageBitmap | OffscreenCanvas | HTMLCanvasElement;
			if (typeof urlOrImage === "string" || urlOrImage instanceof URL) {
				const response = await fetch(urlOrImage);
				const blob = await response.blob();
				image = await createImageBitmap(blob);
			} else {
				image = urlOrImage;
			}

			const spriteCount = countSprites(image);
			return {
				image: image as ImageBitmap | OffscreenCanvas,
				name,
				spriteCount,
			};
		}),
	);

	const totalSpriteCount = images.reduce(
		(sum, { spriteCount }) => sum + spriteCount,
		0,
	);

	const destSize = SOURCE_SIZE;
	const margin = 4;

	const MAX_TEXTURE_SIZE = 2048;
	const k = Math.floor((MAX_TEXTURE_SIZE - margin) / (destSize + margin));
	const destWidth = k * (destSize + margin) + margin;
	const destHeight =
		Math.ceil(totalSpriteCount / k) * (destSize + margin) + margin;

	const canvas = new OffscreenCanvas(destWidth, destHeight);

	// const canvas = document.createElement("canvas");
	// canvas.width = destWidth;
	// canvas.height = destHeight;
	// canvas.style.position = "absolute";
	// canvas.style.top = "0";
	// canvas.style.width = "100%";
	// document.body.appendChild(canvas);

	const ctx = canvas.getContext("2d");

	const coords = {} as Record<sprite, Box[]>;

	let dx = margin;
	let dy = margin;
	for (const { image, name, spriteCount } of images) {
		const boxes: Box[] = [];
		coords[name] = boxes;

		let sy = 0;
		let sx = 0;
		for (let k = spriteCount; k--; ) {
			boxes.push([
				[dx / destWidth, dy / destHeight],
				[(dx + destSize) / destWidth, (dy + destSize) / destHeight],
			]);

			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(
				image,
				sx,
				sy,
				SOURCE_SIZE,
				SOURCE_SIZE,
				dx,
				dy,
				destSize,
				destSize,
			);
			dx += destSize + margin;
			sx += SOURCE_SIZE;
			if (sx >= image.width) {
				sx = 0;
				sy += SOURCE_SIZE;
			}
			if (dx >= destWidth) {
				dx = margin;
				dy += destSize + margin;
			}
		}
	}

	return { texture: canvas, coords };
};
