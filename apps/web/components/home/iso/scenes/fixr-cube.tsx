import type { CSSProperties } from "react";
import { floorRect, IsoBox, IsoDisc, IsoQuad, IsoScene } from "../iso";

const SATELLITES = [
	{ x: -130, y: -40, z: 70, size: 22, tone: "soft", delay: 0 },
	{ x: 60, y: -150, z: 110, size: 16, tone: "base", delay: -1.4 },
	{ x: 150, y: -20, z: 30, size: 26, tone: "raised", delay: -2.8 },
] as const;

type Satellite = (typeof SATELLITES)[number];

/** Parts nearer the back corner sit behind the cube, so they are drawn first. */
const isBehind = (part: Satellite) => part.x < -part.y;

function renderSatellite(part: Satellite) {
	return (
		<g
			className="iso-anim iso-float"
			key={`${part.x}:${part.y}`}
			style={
				{
					"--delay": `${part.delay}s`,
					"--dur": "5s",
					"--float": "-14px",
				} as CSSProperties
			}
		>
			<IsoBox
				d={part.size}
				h={part.size}
				tone={part.tone}
				w={part.size}
				x={part.x}
				y={part.y}
				z={part.z}
			/>
		</g>
	);
}

/** The Fixr mark as a solid block, with a few parts orbiting it. */
export function FixrCubeScene({ label }: { label: string }) {
	return (
		<IsoScene label={label} viewBox="-190 -210 380 320">
			<IsoDisc className="iso-shadow" r={110} x={0} y={0} z={-24} />

			{SATELLITES.filter(isBehind).map(renderSatellite)}

			<g
				className="iso-anim iso-float"
				style={{ "--dur": "6s", "--float": "-10px" } as CSSProperties}
			>
				<IsoBox d={130} h={44} tone="primary" w={130} x={-65} y={-65} />
				<IsoQuad points={floorRect(-30, -30, 44.5, 60, 60)} tone="deep" />
				<IsoBox d={36} h={14} tone="soft" w={36} x={-18} y={-18} z={44.5} />
			</g>
			{SATELLITES.filter((part) => !isBehind(part)).map(renderSatellite)}
		</IsoScene>
	);
}
