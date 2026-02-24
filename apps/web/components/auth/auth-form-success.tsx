import { ArrowRight, CircleCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export default function AuthFormSuccess({
	title,
	description,
	paragraph,
}: {
	title: string;
	description: string;
	paragraph: string;
}) {
	return (
		<div className="flex flex-col items-center space-y-6">
			<div className="rounded-lg bg-primary p-3">
				<CircleCheck className="text-white" />
			</div>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>
			<p className="text-center">{paragraph}</p>
			<Link href="/auth/login">
				<Button>
					Ir para o login <ArrowRight />
				</Button>
			</Link>
		</div>
	);
}
