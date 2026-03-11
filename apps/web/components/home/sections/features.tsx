import { Feather } from "lucide-react";
import { LampContainer } from "@/components/ui/lamp";
import { cn } from "@/lib/utils";

export default function Features({ className }: { className?: string }) {
	return (
		<section
			className={cn(
				"relative flex min-h-96 w-full max-w-7xl flex-col items-center gap-4 lg::gap-10",
				className
			)}
			id="features"
		>
			<LampContainer className="absolute z-[-1] hidden -translate-y-[42.5%] lg:flex" />

			<div className="rounded-full border border-primary bg-background px-3 py-2 font-light text-primary text-xs shadow-[0_4px_30_-8px_var(--primary-500)] md:px-4 md:py-2 md:text-sm">
				<Feather className="mr-2 inline-block h-4 w-4" />
				Simples & intuitivo
			</div>
			<div className="space-y-4">
				<h2 className="text-center font-light text-3xl md:text-5xl lg:text-6xl">
					Seu <span className="font-heading">trabalho</span>, mais{" "}
					<span className="font-heading">fácil</span>
				</h2>
				<p className="text-center font-light text-base md:text-lg lg:text-2xl">
					O Fixr facilita o <b>workflow</b> em todas as áreas de sua assistência
					técnica.
				</p>
			</div>
		</section>
	);
}
