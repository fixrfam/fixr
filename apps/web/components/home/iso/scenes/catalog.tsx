import type { CSSProperties } from "react";
import {
	floorRect,
	IsoBox,
	IsoDisc,
	IsoQuad,
	IsoScene,
	wallRect,
} from "../iso";

function floatStyle(delay: number): CSSProperties {
	return { "--delay": `${delay}s`, "--dur": "5s" } as CSSProperties;
}

/** A notebook, a phone and a tablet hover over the catalog, ready to pick. */
export function CatalogScene({ label }: { label: string }) {
	return (
		<IsoScene label={label} viewBox="-190 -150 380 270">
			<IsoBox d={220} h={6} tone="base" w={220} x={-110} y={-110} />
			<IsoQuad points={floorRect(-96, -96, 6.5, 92, 92)} tone="raised" />
			<IsoQuad points={floorRect(4, 4, 6.5, 92, 92)} tone="raised" />

			<IsoDisc className="iso-shadow" r={40} x={-26} y={-50} z={6} />
			<IsoDisc className="iso-shadow" r={22} x={46} y={-16} z={6} />
			<IsoDisc className="iso-shadow" r={36} x={-6} y={56} z={6} />

			<g className="iso-anim iso-float" style={floatStyle(0)}>
				<IsoBox d={60} h={5} tone="raised" w={92} x={-72} y={-80} z={34} />
				<IsoQuad points={floorRect(-64, -64, 39.5, 76, 30)} tone="base" />
				<IsoBox d={4} h={58} tone="raised" w={92} x={-72} y={-84} z={39} />
				<IsoQuad
					face="left"
					points={wallRect(-66, -79.5, 44, 80, 48)}
					tone="screen"
				/>
				<IsoQuad
					face="left"
					points={wallRect(-58, -79.5, 72, 40, 12)}
					tone="soft"
				/>
			</g>

			<g className="iso-anim iso-float" style={floatStyle(-1.6)}>
				<IsoBox d={6} h={64} tone="raised" w={32} x={30} y={-20} z={36} />
				<IsoQuad
					face="left"
					points={wallRect(33, -13.5, 42, 26, 52)}
					tone="primary"
				/>
			</g>

			<g className="iso-anim iso-float" style={floatStyle(-3.2)}>
				<IsoBox d={54} h={5} tone="raised" w={76} x={-44} y={30} z={26} />
				<IsoQuad points={floorRect(-38, 36, 31.5, 64, 42)} tone="soft" />
			</g>
		</IsoScene>
	);
}
