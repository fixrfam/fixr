import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MdxLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<div
				className="absolute z-0 h-[30rem] w-full bg-primary/40"
				id="gradient"
			>
				<div
					className="h-full w-full bg-gradient-to-b from-transparent to-background"
					id="blackoverlay"
				/>
			</div>
			<main className="relative z-10 mx-auto max-w-7xl px-6 pt-32">
				<Link className="text-muted-foreground text-sm" href={"/"}>
					<ArrowLeft className="inline-block scale-75" /> Voltar para o início
				</Link>
				<div className="my-6 flex flex-wrap items-center gap-4">
					<span
						className="rounded-full bg-primary px-6 py-2 text-white text-xs"
						id="badge"
					>
						Termos legais
					</span>
					<p className="text-muted-foreground text-sm">
						Atualizado por último em: 16/10/2025
					</p>
				</div>
				<article className="grid max-w-3xl grid-cols-1 gap-5 pb-20">
					{children}
				</article>
			</main>
		</>
	);
}
