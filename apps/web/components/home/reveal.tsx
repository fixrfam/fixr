"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Heavy, spring like curve shared by every landing page entrance. */
export const FLUID_EASE = [0.32, 0.72, 0, 1] as const;

/** Fades content up out of a blur the first time it enters the viewport. */
export function Reveal({
	children,
	className,
	delay = 0,
}: {
	children: ReactNode;
	className?: string;
	delay?: number;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			className={className}
			initial={
				reduceMotion
					? { opacity: 0 }
					: { opacity: 0, y: 64, filter: "blur(12px)" }
			}
			transition={{ duration: 0.9, delay, ease: FLUID_EASE }}
			viewport={{ once: true, margin: "-80px" }}
			whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
		>
			{children}
		</motion.div>
	);
}
