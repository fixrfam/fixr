"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Logo } from "@/components/svg/logo";
import { cn } from "@/lib/utils";

export interface AuthSplitProps {
	/** Which half holds the image: the employee login has it on the left, the customer's on the right. */
	imageSide: "left" | "right";
	image: { src: string; alt: string; width: number; height: number };
	/** Four words animated in, the second and fourth in bold. */
	headline: [string, string, string, string];
	cta: string;
	credit?: { label: string; href: string };
	children: ReactNode;
}

/**
 * The sign-in pages: a photo with the headline on one half, the form on the
 * other. The employee and customer logins are mirror images of each other.
 */
export function AuthSplit({
	imageSide,
	image,
	headline,
	cta,
	credit,
	children,
}: AuthSplitProps) {
	const [first, second, third, fourth] = headline;

	return (
		<div className="grid min-h-svh w-full p-6 pt-24 lg:grid-cols-2">
			<div
				className={cn(
					"relative hidden overflow-clip rounded-3xl bg-muted lg:block",
					imageSide === "right" && "lg:order-last"
				)}
			>
				<Image
					alt={image.alt}
					className="absolute inset-0 h-full w-full object-cover"
					height={image.height}
					src={image.src}
					width={image.width}
				/>
				<div className="absolute z-10 flex size-full flex-col justify-between px-16 py-12 xl:px-20 xl:py-16">
					<BlurFade direction="up">
						<Logo className="w-14 shrink-0 text-white" />
					</BlurFade>
					<h1 className="text-[3.875rem] text-white leading-18 tracking-tight xl:text-[4.5rem] xl:leading-21">
						<TextAnimate
							animation="blurInUp"
							as="span"
							by="character"
							delay={0.15}
						>
							{first}
						</TextAnimate>
						<br />{" "}
						<TextAnimate
							animation="blurInUp"
							as="b"
							by="character"
							delay={0.15 * 2}
						>
							{second}
						</TextAnimate>{" "}
						<TextAnimate
							animation="blurInUp"
							as="span"
							by="character"
							delay={0.15 * 3}
						>
							{third}
						</TextAnimate>
						<br />
						<TextAnimate
							animation="blurInUp"
							as="b"
							by="character"
							delay={0.15 * 4}
						>
							{fourth}
						</TextAnimate>
					</h1>
					<BlurFade delay={0.3} direction="up">
						<div>
							<p className="text-white text-xl">{cta}</p>
							{credit && (
								<Link
									href={credit.href}
									rel="noopener noreferrer"
									target="_blank"
								>
									<p className="text-white/50 hover:underline">
										{credit.label}
									</p>
								</Link>
							)}
						</div>
					</BlurFade>
				</div>
			</div>
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex flex-1 items-center justify-center">
					<BlurFade>
						<div className="w-full max-w-xs">{children}</div>
					</BlurFade>
				</div>
			</div>
		</div>
	);
}
