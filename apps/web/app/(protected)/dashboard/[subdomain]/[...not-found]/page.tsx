"use client";

import { ArrowLeft, Construction } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	const router = useRouter();

	return (
		<div className="grid h-dvh w-full place-items-center px-4 text-center">
			<div className="flex flex-col items-center gap-4">
				<div className="grid size-12 place-items-center rounded-md border border-primary bg-primary/20 text-primary ring-2 ring-primary/50">
					<Construction className="size-8" />
				</div>
				<div className="space-y-2">
					<h1 className="font-semibold text-2xl">Em breve por aqui!</h1>
					<p className="mt-2">Essa funcionalidade ainda está em construção.</p>
					<p className="mt-1 text-gray-700 text-sm">
						Estamos trabalhando para lançar novidades o quanto antes. Obrigado
						pela paciência!
					</p>
				</div>
				<Button onClick={() => router.back()} variant={"default"}>
					<ArrowLeft /> Voltar
				</Button>
			</div>
		</div>
	);
}
