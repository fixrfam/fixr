"use client";

import "./iso.css";
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { cn } from "@/lib/utils";

/** A point in world space: x runs right and down, y runs left and down, z runs up. */
export type Point3 = [x: number, y: number, z: number];

export type IsoTone =
	| "base"
	| "raised"
	| "soft"
	| "primary"
	| "deep"
	| "warn"
	| "screen";

const COS_30 = Math.cos(Math.PI / 6);

/** Projects a world point onto the screen with a classic 30° isometric camera. */
export function iso(x: number, y: number, z = 0): [number, number] {
	return [(x - y) * COS_30, (x + y) * 0.5 - z];
}

function toPoints(points: Point3[]) {
	return points
		.map(([x, y, z]) =>
			iso(x, y, z)
				.map((n) => n.toFixed(2))
				.join(",")
		)
		.join(" ");
}

/**
 * CSS variables that move an element by a world space offset. Keyframes read
 * them, so one animation can travel along any isometric axis.
 */
export function isoShift(dx: number, dy: number, dz = 0, prefix = "t") {
	const [sx, sy] = iso(dx, dy, dz);
	return {
		[`--${prefix}x`]: `${sx.toFixed(2)}px`,
		[`--${prefix}y`]: `${sy.toFixed(2)}px`,
	} as CSSProperties;
}

interface IsoBoxProps {
	x?: number;
	y?: number;
	z?: number;
	w: number;
	d: number;
	h: number;
	tone?: IsoTone;
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
}

/** A solid box: draws only the three faces the camera can see. */
export function IsoBox({
	x = 0,
	y = 0,
	z = 0,
	w,
	d,
	h,
	tone = "base",
	className,
	style,
	children,
}: IsoBoxProps) {
	return (
		<g className={cn("iso-box", `iso-${tone}`, className)} style={style}>
			<polygon
				className="iso-left"
				points={toPoints([
					[x, y + d, z + h],
					[x + w, y + d, z + h],
					[x + w, y + d, z],
					[x, y + d, z],
				])}
			/>
			<polygon
				className="iso-right"
				points={toPoints([
					[x + w, y, z + h],
					[x + w, y + d, z + h],
					[x + w, y + d, z],
					[x + w, y, z],
				])}
			/>
			<polygon
				className="iso-top"
				points={toPoints([
					[x, y, z + h],
					[x + w, y, z + h],
					[x + w, y + d, z + h],
					[x, y + d, z + h],
				])}
			/>
			{children}
		</g>
	);
}

interface IsoQuadProps {
	points: Point3[];
	tone?: IsoTone;
	face?: "top" | "left" | "right";
	className?: string;
	style?: CSSProperties;
}

/** A flat shape on any plane, for screens, labels and details on a face. */
export function IsoQuad({
	points,
	tone = "raised",
	face = "top",
	className,
	style,
}: IsoQuadProps) {
	return (
		<polygon
			className={cn("iso-quad", `iso-${tone}`, `iso-${face}`, className)}
			points={toPoints(points)}
			style={style}
		/>
	);
}

/** A rectangle lying on the floor plane at height `z`. */
export function floorRect(
	x: number,
	y: number,
	z: number,
	w: number,
	d: number
): Point3[] {
	return [
		[x, y, z],
		[x + w, y, z],
		[x + w, y + d, z],
		[x, y + d, z],
	];
}

/** A rectangle standing on the plane facing the camera's left side (constant y). */
export function wallRect(
	x: number,
	y: number,
	z: number,
	w: number,
	h: number
): Point3[] {
	return [
		[x, y, z + h],
		[x + w, y, z + h],
		[x + w, y, z],
		[x, y, z],
	];
}

/** A circle lying on the floor, drawn as the ellipse the camera sees. */
export function IsoDisc({
	x,
	y,
	z = 0,
	r,
	className,
	style,
}: {
	x: number;
	y: number;
	z?: number;
	r: number;
	className?: string;
	style?: CSSProperties;
}) {
	const [cx, cy] = iso(x, y, z);
	return (
		<ellipse
			className={className}
			cx={cx}
			cy={cy}
			rx={r * Math.SQRT2 * COS_30}
			ry={r * Math.SQRT1_2}
			style={style}
		/>
	);
}

interface IsoSceneProps {
	label: string;
	viewBox: string;
	className?: string;
	children: ReactNode;
}

/**
 * Wraps a scene in an accessible SVG and only runs its animations while it is
 * on screen, so a page full of scenes costs nothing when scrolled away.
 */
export function IsoScene({
	label,
	viewBox,
	className,
	children,
}: IsoSceneProps) {
	const ref = useRef<SVGSVGElement>(null);
	const [active, setActive] = useState(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => setActive(entry?.isIntersecting ?? false),
			{ rootMargin: "64px" }
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return (
		<svg
			className={cn("iso-scene h-full w-full overflow-visible", className)}
			data-active={active ? "" : undefined}
			ref={ref}
			role="img"
			viewBox={viewBox}
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>{label}</title>
			{children}
		</svg>
	);
}
