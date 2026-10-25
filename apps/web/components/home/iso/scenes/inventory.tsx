import type { CSSProperties } from "react";
import { floorRect, IsoBox, IsoQuad, IsoScene, isoShift } from "../iso";

const SHELF = { x: -100, y: -34, w: 200, d: 64 } as const;
const LEVELS = [0, 56] as const;
const ROOF = 112;
const SLOTS = [-90, -44, 2, 48] as const;
const EMPTY_SLOT = 2;

function Post({ x, y }: { x: number; y: number }) {
	return <IsoBox d={5} h={118} tone="raised" w={5} x={x} y={y} />;
}

/** Shelves of parts: one slot runs low and the supplier's box slides into it. */
export function InventoryScene({ label }: { label: string }) {
	const back = SHELF.y;
	const front = SHELF.y + SHELF.d - 5;
	const right = SHELF.x + SHELF.w - 5;

	return (
		<IsoScene label={label} viewBox="-200 -190 400 300">
			<Post x={SHELF.x} y={back} />
			<Post x={right} y={back} />

			{LEVELS.map((z, level) => (
				<g key={z}>
					<IsoBox
						d={SHELF.d}
						h={5}
						tone="base"
						w={SHELF.w}
						x={SHELF.x}
						y={SHELF.y}
						z={z}
					/>
					{SLOTS.map((x) =>
						level === 1 && x === EMPTY_SLOT ? (
							<g className="iso-anim iso-blink" key={x}>
								<IsoQuad
									className="iso-dashed"
									points={floorRect(x, -24, z + 5.5, 40, 44)}
								/>
							</g>
						) : (
							<IsoBox
								d={44}
								h={36}
								key={x}
								tone={level === 0 && x === 48 ? "soft" : "raised"}
								w={40}
								x={x}
								y={-24}
								z={z + 5}
							/>
						)
					)}
				</g>
			))}

			<g
				className="iso-anim iso-slide-in"
				style={{ ...isoShift(0, 150, 0), "--dur": "6s" } as CSSProperties}
			>
				<IsoBox
					d={44}
					h={36}
					tone="primary"
					w={40}
					x={EMPTY_SLOT}
					y={-24}
					z={61}
				/>
				<IsoQuad
					points={floorRect(EMPTY_SLOT + 8, -14, 97.5, 24, 6)}
					tone="base"
				/>
			</g>

			<IsoBox
				d={SHELF.d}
				h={5}
				tone="base"
				w={SHELF.w}
				x={SHELF.x}
				y={SHELF.y}
				z={ROOF}
			/>
			<Post x={SHELF.x} y={front} />
			<Post x={right} y={front} />
		</IsoScene>
	);
}
