import type { CSSProperties } from "react";
import { floorRect, IsoBox, IsoDisc, IsoQuad, IsoScene } from "../iso";

const LAYERS = 5;
const GAP = 22;
const LIFT = 26;

/**
 * Five stacked access layers, one per role. The active layer lights up and
 * everything above it lifts away, so the picked role's level stands out.
 */
export function RolesScene({
	label,
	active,
}: {
	label: string;
	active: number;
}) {
	return (
		<IsoScene label={label} viewBox="-170 -230 340 340">
			<IsoDisc className="iso-shadow" r={120} x={0} y={0} z={-8} />

			{Array.from({ length: LAYERS }, (_, layer) => {
				const isActive = layer === active;
				const lifted = layer > active ? LIFT : 0;
				return (
					<g
						className="iso-lift"
						key={`layer-${layer.toString()}`}
						style={{ transform: `translateY(${-lifted}px)` } as CSSProperties}
					>
						<IsoBox
							d={160}
							h={7}
							tone={isActive ? "primary" : "base"}
							w={160}
							x={-80}
							y={-80}
							z={layer * GAP}
						/>
						<IsoQuad
							points={floorRect(-64, -64, layer * GAP + 7.5, 44, 44)}
							tone={isActive ? "base" : "raised"}
						/>
						<IsoQuad
							points={floorRect(-8, -64, layer * GAP + 7.5, 72, 16)}
							tone={isActive ? "soft" : "raised"}
						/>
						{isActive && (
							<g
								className="iso-anim iso-float"
								style={{ "--dur": "4s", "--float": "-6px" } as CSSProperties}
							>
								<IsoBox
									d={22}
									h={30}
									tone="deep"
									w={22}
									x={20}
									y={20}
									z={layer * GAP + 7}
								/>
							</g>
						)}
					</g>
				);
			})}
		</IsoScene>
	);
}
