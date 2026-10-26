"use client";

import { motion } from "framer-motion";
import Grid from "../../grid";
import { AppMockup } from "./app-mockup";

export const AppPreview = () => {
	return (
		<motion.div
			className="relative w-full rounded-2xl border-2 border-accent bg-background p-1 lg:rounded-4xl lg:p-2"
			initial={{ y: 10, opacity: 0 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
			whileInView={{ y: 0, opacity: 1 }}
		>
			<div
				className="relative z-2! aspect-1541/1030 overflow-hidden rounded-xl border border-border shadow-[0_0_1rem_0_#ffffff26] lg:rounded-3xl"
				id="appimage"
			>
				<AppMockup />
			</div>
			<div
				className="absolute top-7.5 left-1/2 z-1 h-1/4 w-4/5 -translate-x-1/2 rounded-[100%] bg-primary blur-[110px]"
				id="blueglow"
			/>
			<div
				className="absolute top-7.5 left-1/2 z-1 h-1/4 w-full -translate-x-1/2 -translate-y-full"
				id="grid"
				style={{
					maskImage:
						"radial-gradient(ellipse 60% 100% at 50% 100%, black 20%, transparent 80%)",
					WebkitMaskImage:
						"radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%)",
				}}
			>
				<Grid className="stroke-red-300 opacity-10" stroke={"var(--primary)"} />
			</div>
		</motion.div>
	);
};
