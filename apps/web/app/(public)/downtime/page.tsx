import { env } from "@fixr/env/web";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/dashboard/back-button";
import { Button } from "@/components/ui/button";
import Figure from "../../../public/og_image.jpg";

export default function DowntimePage() {
	return (
		<main className="flex min-h-screen flex-col items-center px-6 py-20">
			<section className="flex w-full max-w-3xl flex-col gap-6 pt-6 text-justify text-sm leading-relaxed md:pt-20 md:text-base">
				<BackButton className="inline-flex w-auto -translate-x-4 self-start px-4" />
				<h1 className="text-left font-heading font-semibold text-2xl md:text-4xl">
					O sistema está temporariamente fora do ar
				</h1>

				<Image
					alt="Fixr Banner"
					className="w-full rounded-lg border border-border"
					src={Figure}
				/>

				<p className="text-muted-foreground">
					Este é um{" "}
					<span className="font-medium text-foreground">
						projeto interdisciplinar desenvolvido na FAM (Faculdade das
						Américas)
					</span>
					. Sua infraestrutura envolve diversos serviços — como o servidor da
					API, banco de dados e sistema de cache — todos hospedados em uma{" "}
					<span className="font-medium text-foreground">VPS privada</span>.
				</p>

				<p className="text-muted-foreground">
					Como esses serviços possuem{" "}
					<span className="font-medium text-foreground">custos em dólar</span>,
					optamos por mantê-los disponíveis apenas durante o período de contexto
					e apresentações dos Projetos Integradores (PIs).
				</p>

				<p className="text-muted-foreground">
					Fora desses períodos, o backend é desativado para reduzir custos
					operacionais, permanecendo apenas o frontend acessível para fins de
					demonstração e consulta visual.
				</p>

				<p className="text-muted-foreground">
					Caso queira conhecer mais sobre o funcionamento do projeto, sua
					arquitetura e principais decisões técnicas, você pode acessar a
					documentação ou explorar os demais links disponíveis.
				</p>

				<div className="flex gap-4">
					<Link href={env.NEXT_PUBLIC_LINKTREE_URL ?? "/"}>
						<Button className="font-light">
							Linktree <ExternalLink className="inline-block h-5 w-5" />
						</Button>
					</Link>
					<Link href={env.NEXT_PUBLIC_DOCS_URL ?? "/"}>
						<Button className="font-light" variant="outline">
							Documentação <ExternalLink className="inline-block h-5 w-5" />
						</Button>
					</Link>
				</div>

				<p className="text-muted-foreground">
					Agradecemos sua compreensão e interesse no projeto.
				</p>

				<p>Atenciosamente, a equipe Fixr.</p>
			</section>
		</main>
	);
}
