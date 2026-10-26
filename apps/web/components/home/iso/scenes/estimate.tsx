import type { CSSProperties } from "react";
import { floorRect, IsoBox, IsoDisc, IsoQuad, IsoScene, iso } from "../iso";

const ROWS = [
	{ y: -64, w: 96 },
	{ y: -40, w: 72 },
	{ y: -16, w: 84 },
	{ y: 8, w: 60 },
] as const;

const STAMP = { x: 4, y: 34, size: 44 } as const;

function checkPath(z: number) {
	const { x, y, size } = STAMP;
	const points = [
		iso(x + size * 0.25, y + size * 0.55, z),
		iso(x + size * 0.45, y + size * 0.75, z),
		iso(x + size * 0.78, y + size * 0.3, z),
	];
	return `M${points.map(([px, py]) => `${px.toFixed(2)} ${py.toFixed(2)}`).join(" L")}`;
}

/** The estimate fills in line by line, then the approval stamp lands on it. */
export function EstimateScene({ label }: { label: string }) {
	return (
		<IsoScene label={label} viewBox="-150 -110 300 230">
			<IsoDisc className="iso-shadow" r={100} x={0} y={0} z={-6} />
			<IsoBox d={180} h={5} tone="base" w={140} x={-70} y={-90} />

			{ROWS.map((row, index) => (
				<g
					className="iso-anim iso-appear"
					key={row.y}
					style={{ "--delay": `${index * 0.35}s` } as CSSProperties}
				>
					<IsoQuad
						points={floorRect(-54, row.y, 5.5, row.w, 9)}
						tone="raised"
					/>
				</g>
			))}
			<g
				className="iso-anim iso-appear"
				style={{ "--delay": "1.4s" } as CSSProperties}
			>
				<IsoQuad points={floorRect(-54, 40, 5.5, 46, 12)} tone="soft" />
			</g>

			<g className="iso-anim iso-pulse">
				<IsoDisc
					className="iso-ring"
					r={30}
					x={STAMP.x + STAMP.size / 2}
					y={STAMP.y + STAMP.size / 2}
					z={5}
				/>
			</g>
			<g className="iso-anim iso-drop">
				<IsoBox
					d={STAMP.size}
					h={14}
					tone="primary"
					w={STAMP.size}
					x={STAMP.x}
					y={STAMP.y}
					z={5}
				/>
				<path className="iso-check" d={checkPath(19)} />
			</g>
		</IsoScene>
	);
}
