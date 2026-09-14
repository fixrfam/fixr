"use client";

import { KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { CreateApiKeyForm } from "./create-api-key-form";
import { SecretReveal } from "./secret-reveal";

/**
 * Creation flow for an API key.
 *
 * Holds the plaintext secret only in local state, and only until the dialog
 * closes: the API returns it exactly once and never again.
 */
export function CreateApiKeyDialog() {
	const [open, setOpen] = useState(false);
	const [created, setCreated] = useState<{
		secret: string;
		name: string;
	} | null>(null);

	function handleOpenChange(next: boolean) {
		setOpen(next);

		if (!next) {
			// Drop the secret as soon as the dialog goes away.
			setCreated(null);
		}
	}

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="size-4" />
					Nova chave
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[calc(100dvh-5rem)] w-full! max-w-2xl! overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-4">
						<div className="grid size-12 shrink-0 place-items-center rounded-md bg-primary [&_svg]:size-6 [&_svg]:text-white">
							<KeyRound />
						</div>
						<div>
							<DialogTitle className="font-heading font-semibold text-2xl">
								{created ? "Chave criada" : "Nova chave de API"}
							</DialogTitle>
							<DialogDescription className="text-muted-foreground text-sm">
								{created
									? `Guarde o segredo de "${created.name}" em local seguro.`
									: "Acesso programático à API do Fixr, com as permissões do seu cargo."}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{created ? (
					<SecretReveal
						onDone={() => handleOpenChange(false)}
						secret={created.secret}
					/>
				) : (
					<CreateApiKeyForm onCreated={setCreated} />
				)}
			</DialogContent>
		</Dialog>
	);
}
