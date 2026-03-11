import { env } from "@fixr/env/web";
import { ExternalLink, WandSparkles } from "lucide-react";
import Link from "next/link";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Button } from "@/components/ui/button";
import { AppPreview } from "./app-preview";

export default function Hero() {
	return (
		<section className="z-2 flex w-full max-w-7xl flex-col items-start justify-center gap-10 space-y-6 py-2 lg:py-10">
			<div className="z-3 flex w-full flex-col items-start gap-4">
				<BlurFade delay={0.3} direction="up" inView>
					<div className="rounded-full border border-primary bg-primary/15 px-3 py-2 font-light text-primary text-xs shadow-[0_4px_30_-8px_var(--primary-500)] md:px-4 md:py-2 md:text-sm">
						<WandSparkles className="mr-2 inline-block h-4 w-4" />
						Simplifique e expanda
					</div>
				</BlurFade>
				<div className="flex w-full flex-col justify-between gap-4 lg:flex-row lg:gap-8">
					<div>
						<h1 className="font-light 2lg:text-5xl text-2xl sm:text-5xl lg:text-4xl xl:text-5.5xl">
							<TextAnimate animation="blurInUp" as="span" by="character">
								O jeito
							</TextAnimate>{" "}
							<TextAnimate
								animation="blurInUp"
								as="span"
								by="character"
								className="font-heading"
								delay={0.3}
							>
								fácil
							</TextAnimate>{" "}
							<TextAnimate
								animation="blurInUp"
								as="span"
								by="character"
								delay={0.3 * 2}
							>
								de gerenciar sua
							</TextAnimate>
							<br />
							<TextAnimate
								animation="slideUp"
								as="span"
								by="word"
								className="font-heading"
								delay={0.3 * 3}
							>
								assistência técnica
							</TextAnimate>
						</h1>
					</div>
					<div className="space-y-8 lg:w-md lg:space-y-4">
						<TextAnimate
							animate="slideUp"
							as="p"
							by="word"
							className="max-w-lg font-light text-sm lg:text-base"
							delay={0.3}
							duration={1}
						>
							Consolide suas ordens de serviço, o controle de estoque e o
							acompanhamento dos consertos em um só lugar.
						</TextAnimate>
						<div className="flex gap-4">
							<BlurFade delay={0.3 * 2} inView>
								<Link href="/auth/login">
									<Button className="font-light">Acessar o Fixr</Button>
								</Link>
							</BlurFade>
							<BlurFade delay={0.3 * 2 + 0.15} inView>
								<Link href={env.NEXT_PUBLIC_DOCS_URL ?? "/"}>
									<Button className="font-light" variant="outline">
										Documentação{" "}
										<ExternalLink className="ml-2 inline-block h-5 w-5" />
									</Button>
								</Link>
							</BlurFade>
						</div>
					</div>
				</div>
			</div>
			<AppPreview />
		</section>
	);
}
