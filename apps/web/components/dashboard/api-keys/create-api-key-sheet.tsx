"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { CreateApiKeyForm } from "./create-api-key-form";
import { SecretReveal } from "./secret-reveal";

/**
 * Creation flow for an API key.
 *
 * Holds the plaintext secret only in local state, and only until the sheet
 * closes: the API returns it exactly once and never again.
 */
export function CreateApiKeySheet() {
	const [open, setOpen] = useState(false);
	const [created, setCreated] = useState<{
		secret: string;
		name: string;
	} | null>(null);

	function handleOpenChange(next: boolean) {
		setOpen(next);

		if (!next) {
			// Drop the secret as soon as the sheet goes away.
			setCreated(null);
		}
	}

	/**
	 * While the secret is on screen it exists nowhere else, so closing by
	 * accident would lose it for good. Only the explicit button closes here.
	 */
	function guardDismiss(event: { preventDefault: () => void }) {
		if (created) {
			event.preventDefault();
		}
	}

	return (
		<Sheet onOpenChange={handleOpenChange} open={open}>
			<SheetTrigger asChild>
				<Button>
					<Plus className="size-4" />
					Nova chave
				</Button>
			</SheetTrigger>
			<SheetContent
				className="w-full gap-0 overflow-y-auto sm:max-w-lg"
				onEscapeKeyDown={guardDismiss}
				onInteractOutside={guardDismiss}
			>
				<SheetHeader className="gap-1.5">
					<SheetTitle className="font-heading font-semibold text-xl">
						{created ? "Chave criada" : "Nova chave de API"}
					</SheetTitle>
					<SheetDescription>
						{created
							? `Guarde o segredo de "${created.name}" em local seguro.`
							: "A chave é sua e carrega as permissões do seu cargo."}
					</SheetDescription>
				</SheetHeader>

				<div className="px-4 pb-6">
					{created ? (
						<SecretReveal
							onDone={() => handleOpenChange(false)}
							secret={created.secret}
						/>
					) : (
						<CreateApiKeyForm onCreated={setCreated} />
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
