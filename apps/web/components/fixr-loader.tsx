"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** The pins of the chip, as [x1, y1, x2, y2]. */
const PINS = [
	[48, 10.7, 48, 21.3],
	[80, 10.7, 80, 21.3],
	[106.7, 48, 117.3, 48],
	[106.7, 80, 117.3, 80],
	[80, 106.7, 80, 117.3],
	[48, 106.7, 48, 117.3],
	[10.7, 80, 21.3, 80],
	[10.7, 48, 21.3, 48],
] as const;

/**
 * Fixr's loading indicator: a stroke that draws the chip of the logo, then
 * erases it, over a faint copy of the chip.
 */
export function FixrLoader({
	className,
	label,
}: {
	className?: string;
	/** Read by screen readers; defaults to "Loading". */
	label?: string;
}) {
	const { t } = useTranslation();

	const text = label ?? t("common.states.loading");

	return (
		<output
			aria-label={text}
			className={cn("inline-grid size-10 text-primary", className)}
		>
			<svg
				aria-hidden
				className="fixr-loader size-full"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="8"
				viewBox="0 0 128 128"
				xmlns="http://www.w3.org/2000/svg"
			>
				<title>{text}</title>
				<g className="fixr-loader-track">
					<rect height="81.3" rx="12.7" width="81.3" x="23.3" y="23.3" />
					<rect height="37" rx="8.2" width="37" x="46" y="46" />
					{PINS.map(([x1, y1, x2, y2]) => (
						<line key={`${x1}-${y1}`} x1={x1} x2={x2} y1={y1} y2={y2} />
					))}
				</g>
				<g>
					<rect
						className="fixr-loader-draw fixr-loader-body"
						height="81.3"
						pathLength={100}
						rx="12.7"
						width="81.3"
						x="23.3"
						y="23.3"
					/>
					<rect
						className="fixr-loader-draw fixr-loader-core"
						height="37"
						pathLength={100}
						rx="8.2"
						width="37"
						x="46"
						y="46"
					/>
					{PINS.map(([x1, y1, x2, y2], index) => (
						<line
							className="fixr-loader-draw fixr-loader-pin"
							key={`${x1}-${y1}`}
							pathLength={100}
							style={{ "--pin": index } as CSSProperties}
							x1={x1}
							x2={x2}
							y1={y1}
							y2={y2}
						/>
					))}
				</g>
			</svg>
		</output>
	);
}
