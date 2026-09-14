"use client";

import { toast } from "@pheralb/toast";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Shows a freshly created key's secret.
 *
 * This is the only moment the plaintext exists on the client: the API stores
 * just an HMAC of it, so once this dialog closes the value is unrecoverable.
 */
export function SecretReveal({
	secret,
	onDone,
}: {
	secret: string;
	onDone: () => void;
}) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(secret);
			setCopied(true);
			toast.success({ text: "Segredo copiado" });
		} catch {
			toast.error({
				text: "Não foi possível copiar",
				description: "Selecione o texto e copie manualmente.",
			});
		}
	}

	return (
		<div className="space-y-5">
			<Alert variant="destructive">
				<TriangleAlert />
				<AlertTitle>
					Copie agora, este segredo não será exibido de novo
				</AlertTitle>
				<AlertDescription>
					O Fixr guarda apenas um hash da chave. Se você perder este valor, será
					preciso revogar a chave e criar outra.
				</AlertDescription>
			</Alert>

			<div className="space-y-2">
				<p className="font-medium text-sm">Seu segredo</p>
				<div className="flex items-center gap-2">
					<code className="min-w-0 grow break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs">
						{secret}
					</code>
					<Button
						onClick={copy}
						size="icon"
						type="button"
						variant={copied ? "secondary" : "outline"}
					>
						{copied ? (
							<Check className="size-4" />
						) : (
							<Copy className="size-4" />
						)}
						<span className="sr-only">Copiar segredo</span>
					</Button>
				</div>
				<p className="text-muted-foreground text-xs">
					Envie no header <code>x-api-key</code> ou como{" "}
					<code>Authorization: Bearer &lt;segredo&gt;</code>.
				</p>
			</div>

			<Button className="w-full" onClick={onDone} type="button">
				Já copiei, fechar
			</Button>
		</div>
	);
}
