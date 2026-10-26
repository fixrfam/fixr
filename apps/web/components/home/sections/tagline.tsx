"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Word {
	text: string;
	highlight: boolean;
}

/** Splits a line into words, flagging the ones wrapped in `*asterisks*`. */
function parseLine(line: string): Word[] {
	let highlight = false;
	return line.split(" ").map((raw) => {
		const opens = raw.startsWith("*");
		const closes = raw.indexOf("*", opens ? 1 : 0) !== -1;
		if (opens) {
			highlight = true;
		}
		const word = { text: raw.replaceAll("*", ""), highlight };
		if (closes) {
			highlight = false;
		}
		return word;
	});
}

/**
 * Big tagline whose words light up one at a time, in reading order, as the
 * section crosses the middle of the viewport.
 */
export default function Tagline() {
	const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);
	const [lit, setLit] = useState(0);

	const lines = [t("home.tagline.lineOne"), t("home.tagline.lineTwo")].map(
		parseLine
	);
	const total = lines.reduce((sum, words) => sum + words.length, 0);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return;
		}

		let frame = 0;
		const update = () => {
			frame = 0;
			const { top, height } = element.getBoundingClientRect();
			// 0 when the block's top reaches 80% of the viewport, 1 when its bottom hits 45%.
			const start = window.innerHeight * 0.8;
			const end = window.innerHeight * 0.45 - height;
			const progress = Math.min(Math.max((start - top) / (start - end), 0), 1);
			setLit(Math.round(progress * total));
		};
		const schedule = () => {
			if (!frame) {
				frame = requestAnimationFrame(update);
			}
		};

		// Only listen while the section is near the viewport.
		const observer = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) {
				window.addEventListener("scroll", schedule, { passive: true });
				schedule();
			} else {
				window.removeEventListener("scroll", schedule);
			}
		});
		observer.observe(element);

		return () => {
			observer.disconnect();
			window.removeEventListener("scroll", schedule);
			cancelAnimationFrame(frame);
		};
	}, [total]);

	let index = 0;

	return (
		<section className="flex w-full max-w-7xl justify-center py-8 md:py-16">
			<div
				className="max-w-5xl text-balance text-center font-light text-3xl md:text-5xl"
				ref={ref}
			>
				<p className="sr-only">
					{lines
						.map((words) => words.map((word) => word.text).join(" "))
						.join(" ")}
				</p>
				<div aria-hidden="true">
					{lines.map((words, line) => (
						<span className="block" key={`line-${line.toString()}`}>
							{words.map((word) => {
								const position = index++;
								return (
									<span
										className={cn(
											"transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
											word.highlight
												? "font-heading text-primary"
												: "text-foreground"
										)}
										key={`${position.toString()}-${word.text}`}
										style={{ opacity: position < lit ? 1 : 0.3 }}
									>
										{word.text}{" "}
									</span>
								);
							})}
						</span>
					))}
				</div>
			</div>
		</section>
	);
}
