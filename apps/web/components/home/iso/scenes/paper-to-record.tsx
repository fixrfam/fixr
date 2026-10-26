import type { CSSProperties } from "react";
import {
	floorRect,
	IsoBox,
	IsoDisc,
	IsoQuad,
	IsoScene,
	isoShift,
} from "../iso";

const STACK = { x: 44, y: -14, z: 22 } as const;
const SHEET = { w: 52, d: 66, h: 2 } as const;

/** Where each loose slip starts, ordered by where it ends up in the stack. */
const SHEETS = [
	{ x: -150, y: 40, z: 12 },
	{ x: -170, y: -70, z: 46 },
	{ x: -60, y: 70, z: 30 },
	{ x: -90, y: -130, z: 80 },
	{ x: -30, y: -40, z: 104 },
] as const;

/** Loose paper slips fly in and settle into one neat Fixr record. */
export function PaperToRecordScene({ label }: { label: string }) {
	return (
		<IsoScene label={label} viewBox="-210 -170 420 300">
			<IsoDisc className="iso-shadow" r={96} x={70} y={20} z={-6} />
			<IsoBox d={112} h={20} tone="primary" w={92} x={24} y={-36} />
			<IsoQuad points={floorRect(32, -28, 20.5, 76, 96)} tone="deep" />

			{SHEETS.map((sheet, index) => (
				<g
					className="iso-anim iso-converge"
					key={`${sheet.x}:${sheet.y}`}
					style={
						{
							...isoShift(
								STACK.x - sheet.x,
								STACK.y - sheet.y,
								STACK.z + index * 4 - sheet.z
							),
							"--delay": `${index * 0.18}s`,
							"--dur": "7s",
						} as CSSProperties
					}
				>
					<IsoBox
						d={SHEET.d}
						h={SHEET.h}
						tone="base"
						w={SHEET.w}
						x={sheet.x}
						y={sheet.y}
						z={sheet.z}
					/>
					<IsoQuad
						points={floorRect(sheet.x + 8, sheet.y + 10, sheet.z + 2.5, 30, 6)}
						tone={index === SHEETS.length - 1 ? "primary" : "raised"}
					/>
					<IsoQuad
						points={floorRect(sheet.x + 8, sheet.y + 24, sheet.z + 2.5, 36, 4)}
						tone="raised"
					/>
				</g>
			))}
		</IsoScene>
	);
}
