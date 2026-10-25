import type { CSSProperties } from "react";
import { floorRect, IsoBox, IsoQuad, IsoScene, isoShift } from "../iso";

const LANE_STEP = 100;
const LANES = [-140, -40, 60] as const;
const LANE_TONES = ["raised", "soft", "primary"] as const;

/** Order cards hop across three status lanes: open, in progress, done. */
export function ServiceOrdersScene({ label }: { label: string }) {
	const travel = isoShift(LANE_STEP, 0);

	return (
		<IsoScene label={label} viewBox="-230 -110 460 230">
			<IsoBox d={150} h={12} tone="base" w={320} x={-160} y={-70} />

			{LANES.map((x, index) => (
				<g key={x}>
					<IsoBox d={120} h={4} tone="raised" w={88} x={x - 4} y={-55} z={12} />
					<IsoBox
						d={4}
						h={18}
						tone={LANE_TONES[index]}
						w={88}
						x={x - 4}
						y={-59}
						z={12}
					/>
					<IsoQuad points={floorRect(x + 6, 40, 16.5, 40, 10)} tone="base" />
					<IsoQuad points={floorRect(x + 50, 40, 16.5, 22, 10)} tone="base" />
				</g>
			))}

			<g
				className="iso-anim iso-travel"
				style={{ ...travel, "--dur": "7s" } as CSSProperties}
			>
				<IsoBox d={30} h={7} tone="base" w={64} x={-128} y={-44} z={16} />
				<IsoQuad points={floorRect(-120, -36, 23.5, 30, 6)} tone="primary" />
			</g>
			<g
				className="iso-anim iso-travel"
				style={
					{ ...travel, "--dur": "7s", "--delay": "-3.5s" } as CSSProperties
				}
			>
				<IsoBox d={30} h={7} tone="primary" w={64} x={-128} y={2} z={16} />
				<IsoQuad points={floorRect(-120, 10, 23.5, 30, 6)} tone="base" />
			</g>
		</IsoScene>
	);
}
