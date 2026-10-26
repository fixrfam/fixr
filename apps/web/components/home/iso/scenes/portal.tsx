import type { CSSProperties } from "react";
import { IsoBox, IsoDisc, IsoQuad, IsoScene, iso, wallRect } from "../iso";

const PHONE = { x: -44, y: -6, w: 88, d: 10, h: 160 } as const;
const STEPS = [118, 88, 58] as const;
const FACE = PHONE.y + PHONE.d + 0.5;

/** The customer's phone shows the repair moving through its statuses. */
export function PortalScene({ label }: { label: string }) {
	const [lineX, lineTop] = iso(PHONE.x + 20, FACE, STEPS[0]);
	const [, lineBottom] = iso(PHONE.x + 20, FACE, STEPS[2]);

	return (
		<IsoScene label={label} viewBox="-150 -200 300 280">
			<IsoDisc className="iso-shadow" r={64} x={0} y={0} z={-10} />

			<g
				className="iso-anim iso-float"
				style={{ "--dur": "6s", "--float": "-6px" } as CSSProperties}
			>
				<IsoBox
					d={PHONE.d}
					h={PHONE.h}
					tone="raised"
					w={PHONE.w}
					x={PHONE.x}
					y={PHONE.y}
				/>
				<IsoQuad
					face="left"
					points={wallRect(PHONE.x + 6, FACE, 12, PHONE.w - 12, PHONE.h - 26)}
					tone="screen"
				/>
				<IsoQuad
					face="left"
					points={wallRect(PHONE.x + 14, FACE, 128, PHONE.w - 28, 10)}
					tone="soft"
				/>
				<line
					className="iso-ring"
					x1={lineX}
					x2={lineX}
					y1={lineTop}
					y2={lineBottom}
				/>
				{STEPS.map((z, index) => {
					const [cx, cy] = iso(PHONE.x + 20, FACE, z);
					return (
						<g key={z}>
							<circle
								className="iso-dot iso-anim iso-blink"
								cx={cx}
								cy={cy}
								r={5}
								style={
									{
										"--delay": `${index * -1}s`,
										"--dur": "3s",
									} as CSSProperties
								}
							/>
							<IsoQuad
								face="left"
								points={wallRect(PHONE.x + 32, FACE, z - 4, 36 - index * 6, 8)}
								tone="raised"
							/>
						</g>
					);
				})}
			</g>

			<g
				className="iso-anim iso-float"
				style={
					{
						"--dur": "6s",
						"--delay": "-2s",
						"--float": "-12px",
					} as CSSProperties
				}
			>
				<IsoBox d={40} h={10} tone="primary" w={64} x={24} y={-56} z={168} />
				<IsoQuad
					points={[
						[32, -46, 178.5],
						[72, -46, 178.5],
						[72, -38, 178.5],
						[32, -38, 178.5],
					]}
					tone="base"
				/>
			</g>
		</IsoScene>
	);
}
