import { mat4 } from "gl-matrix";
import { State } from "./state";

export const attachUserEvent = (state: State) => {
	window.addEventListener("mousemove", (e) => {
		state.pointer.x = e.clientX / window.innerWidth;
		state.pointer.y = e.clientY / window.innerHeight;
	});

	// two finger pinch to zoom
	let pinchAnchor: { l0: number; zoom0: number } | null = null;
	window.addEventListener("touchmove", (e) => {
		if (e.touches.length >= 2) {
			const l = Math.hypot(
				e.touches[0].clientX - e.touches[1].clientX,
				e.touches[0].clientY - e.touches[1].clientY,
			);
			if (!pinchAnchor) pinchAnchor = { l0: l, zoom0: state.zoom };
			else {
				state.zoom = Math.min(
					1,
					Math.max(0.1, pinchAnchor.zoom0 * Math.sqrt(pinchAnchor.l0 / l)),
				);
			}
		} else {
			pinchAnchor = null;
		}

		if (e.touches.length === 1) {
			state.pointer.x = e.touches[0].clientX / window.innerWidth;
			state.pointer.y = e.touches[0].clientY / window.innerHeight;
		}
	});
	window.addEventListener("touchend", (e) => {
		pinchAnchor = null;
	});

	window.addEventListener(
		"wheel",
		(e) => {
			state.zoom = Math.min(
				1,
				Math.max(0, state.zoom + e.deltaY / window.innerHeight / 3),
			);
		},
		{ passive: true },
	);
};
