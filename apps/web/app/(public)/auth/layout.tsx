import Image from "next/image";
import Link from "next/link";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Logo } from "@/components/svg/logo";
import LoginBg from "@/public/login_bg.webp";

export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="grid min-h-svh w-full p-6 pt-24 lg:grid-cols-2">
			<div className="relative hidden overflow-clip rounded-3xl bg-muted lg:block">
				<Image
					alt="Uma pessoa consertando um laptop com uma chave de fenda."
					className="absolute inset-0 h-full w-full object-cover"
					src={LoginBg}
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
							Gerenciando
						</TextAnimate>
						<br />{" "}
						<TextAnimate
							animation="blurInUp"
							as="b"
							by="character"
							delay={0.15 * 2}
						>
							serviços
						</TextAnimate>{" "}
						<TextAnimate
							animation="blurInUp"
							as="span"
							by="character"
							delay={0.15 * 3}
						>
							com
						</TextAnimate>
						<br />
						{""}
						<TextAnimate
							animation="blurInUp"
							as="b"
							by="character"
							delay={0.15 * 4}
						>
							excelência.
						</TextAnimate>
					</h1>
					<BlurFade delay={0.3} direction="up">
						<div>
							<p className="text-white text-xl">Faça login para começar.</p>
							<Link
								href="https://unsplash.com/pt-br/fotografias/uma-pessoa-trabalhando-em-um-laptop-com-uma-caneta-XTs2Fl2iXkY"
								rel="noopener noreferrer"
								target="_blank"
							>
								<p className="text-white/50 hover:underline">
									Foto de Samsung Memory na Unsplash
								</p>
							</Link>
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
