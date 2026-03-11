"use client";
import { motion } from "framer-motion";
import type React from "react";
import { cn } from "@/lib/utils";

export const LampContainer = ({
	children,
	className,
}: {
	children?: React.ReactNode;
	className?: string;
}) => {
	return (
		<div
			className={cn(
				"pointer-events-none relative z-0 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden rounded-md",
				className
			)}
		>
			<div className="relative isolate z-0 flex w-full flex-1 scale-y-125 items-center justify-center">
				<motion.div
					className="absolute inset-auto right-1/2 h-56 w-120 overflow-visible bg-gradient-conic from-primary via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
					id="lglow"
					initial={{ opacity: 0.5, width: "15rem" }}
					style={{
						backgroundImage:
							"conic-gradient(var(--conic-position), var(--tw-gradient-stops))",
					}}
					transition={{
						delay: 0.3,
						duration: 0.8,
						ease: "easeInOut",
					}}
					whileInView={{ opacity: 1, width: "30rem" }}
				>
					<div className="mask-[linear-gradient(to_top,white,transparent)] absolute bottom-0 left-0 z-20 h-40 w-full bg-background" />
					<div className="mask-[linear-gradient(to_right,white,transparent)] absolute bottom-0 left-0 z-20 h-full w-40 bg-background" />
				</motion.div>
				<motion.div
					className="absolute inset-auto left-1/2 h-56 w-120 bg-gradient-conic from-transparent via-transparent to-primary text-white [--conic-position:from_290deg_at_center_top]"
					id="rglow"
					initial={{ opacity: 0.5, width: "15rem" }}
					style={{
						backgroundImage:
							"conic-gradient(var(--conic-position), var(--tw-gradient-stops))",
					}}
					transition={{
						delay: 0.3,
						duration: 0.8,
						ease: "easeInOut",
					}}
					whileInView={{ opacity: 1, width: "30rem" }}
				>
					<div className="mask-[linear-gradient(to_left,white,transparent)] absolute right-0 bottom-0 z-20 h-full w-40 bg-background" />
					<div className="mask-[linear-gradient(to_top,white,transparent)] absolute right-0 bottom-0 z-20 h-40 w-full bg-background" />
				</motion.div>
				<div
					className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-background blur-2xl"
					id="topglow"
				/>
				<div
					className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"
					id="topglow"
				/>
				<div
					className="absolute inset-auto z-50 h-36 w-md -translate-y-1/2 rounded-full bg-primary opacity-50 blur-3xl"
					id="topglow"
				/>
				<motion.div
					className="absolute inset-auto z-30 h-36 w-64 -translate-y-24 rounded-full bg-primary-300 blur-2xl"
					id="largeglow"
					initial={{ width: "8rem" }}
					transition={{
						delay: 0.3,
						duration: 0.8,
						ease: "easeInOut",
					}}
					whileInView={{ width: "16rem" }}
				/>
				<motion.div
					className="absolute inset-auto z-50 h-0.5 w-120 -translate-y-28 bg-primary-300"
					id="bulb"
					initial={{ width: "15rem" }}
					transition={{
						delay: 0.3,
						duration: 0.8,
						ease: "easeInOut",
					}}
					whileInView={{ width: "30rem" }}
				/>

				<div
					className="absolute inset-auto z-40 h-44 w-full -translate-y-50 bg-background"
					id="darken"
				/>
			</div>

			<div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
				{children}
			</div>
		</div>
	);
};
