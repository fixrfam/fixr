"use client";

import { useTranslation } from "@fixr/i18n/react";
import { cn } from "@/lib/utils";

/** The logo's shapes (frame, core and pins), drawn filled. */
const MARK_0 =
	"M32 21.333h64c5.891 0 10.667 4.776 10.667 10.667v64c0 5.891-4.776 10.667-10.667 10.667H32c-5.891 0-10.667-4.776-10.667-10.667V32c0-5.891 4.776-10.667 10.667-10.667ZM52.167 46h24.666A6.167 6.167 0 0 1 83 52.167v24.666A6.167 6.167 0 0 1 76.833 83H52.167A6.167 6.167 0 0 1 46 76.833V52.167A6.167 6.167 0 0 1 52.167 46Z";
const MARK_1 =
	"M17.333 32c0-8.1 6.567-14.667 14.667-14.667h64c8.1 0 14.667 6.567 14.667 14.667v64c0 8.1-6.567 14.667-14.667 14.667H32c-8.1 0-14.667-6.567-14.667-14.667V32ZM32 25.333A6.667 6.667 0 0 0 25.333 32v64A6.667 6.667 0 0 0 32 102.667h64A6.667 6.667 0 0 0 102.667 96V32A6.667 6.667 0 0 0 96 25.333H32Zm10 26.834C42 46.552 46.552 42 52.167 42h24.666C82.448 42 87 46.552 87 52.167v24.666C87 82.448 82.448 87 76.833 87H52.167C46.552 87 42 82.448 42 76.833V52.167ZM52.167 50C50.97 50 50 50.97 50 52.167v24.666C50 78.03 50.97 79 52.167 79h24.666C78.03 79 79 78.03 79 76.833V52.167C79 50.97 78.03 50 76.833 50H52.167Z";
const MARK_2 =
	"M80 6.667a4 4 0 0 1 4 4v10.666a4 4 0 1 1-8 0V10.667a4 4 0 0 1 4-4ZM80 102.667a4 4 0 0 1 4 4v10.666a4 4 0 0 1-8 0v-10.666a4 4 0 0 1 4-4ZM6.667 80a4 4 0 0 1 4-4h10.666a4 4 0 0 1 0 8H10.667a4 4 0 0 1-4-4ZM6.667 48a4 4 0 0 1 4-4h10.666a4 4 0 0 1 0 8H10.667a4 4 0 0 1-4-4ZM102.667 80a4 4 0 0 1 4-4h10.666a4 4 0 0 1 0 8h-10.666a4 4 0 0 1-4-4ZM102.667 48a4 4 0 0 1 4-4h10.666a4 4 0 0 1 0 8h-10.666a4 4 0 0 1-4-4ZM48 6.667a4 4 0 0 1 4 4v10.666a4 4 0 1 1-8 0V10.667a4 4 0 0 1 4-4ZM48 102.667a4 4 0 0 1 4 4v10.666a4 4 0 0 1-8 0v-10.666a4 4 0 0 1 4-4Z";

/** The logo's silhouette, pins included, a little outside its edge. */
const OUTLINE =
	"M32 14.333L41 14.333L41 10.667A7 7 0 0 1 55 10.667L55 14.333L73 14.333L73 10.667A7 7 0 0 1 87 10.667L87 14.333L96 14.333A17.667 17.667 0 0 1 113.667 32L113.667 41L117.333 41A7 7 0 0 1 117.333 55L113.667 55L113.667 73L117.333 73A7 7 0 0 1 117.333 87L113.667 87L113.667 96A17.667 17.667 0 0 1 96 113.667L87 113.667L87 117.333A7 7 0 0 1 73 117.333L73 113.667L55 113.667L55 117.333A7 7 0 0 1 41 117.333L41 113.667L32 113.667A17.667 17.667 0 0 1 14.333 96L14.333 87L10.667 87A7 7 0 0 1 10.667 73L14.333 73L14.333 55L10.667 55A7 7 0 0 1 10.667 41L14.333 41L14.333 32A17.667 17.667 0 0 1 32 14.333Z";

/**
 * Fixr's loading indicator: the logo, filled and faint, with a thin line
 * running around its outline that eases in and out on each lap.
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
				aria-hidden="true"
				className="fixr-loader size-full overflow-visible"
				fill="none"
				viewBox="0 0 128 128"
				xmlns="http://www.w3.org/2000/svg"
			>
				<title>{text}</title>
				<g className="fixr-loader-mark" fill="currentColor" fillRule="evenodd">
					<path d={MARK_0} />
					<path d={MARK_1} />
					<path d={MARK_2} />
				</g>
				<path
					className="fixr-loader-track"
					d={OUTLINE}
					stroke="currentColor"
					strokeWidth="1"
					vectorEffect="non-scaling-stroke"
				/>
				<path
					className="fixr-loader-run"
					d={OUTLINE}
					pathLength={100}
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="1.5"
					vectorEffect="non-scaling-stroke"
				/>
			</svg>
		</output>
	);
}
