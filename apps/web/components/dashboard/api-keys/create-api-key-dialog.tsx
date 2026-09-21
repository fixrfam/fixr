"use client";

import { KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
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

	/**
	 * While the secret is on screen it exists nowhere else, so closing by
	 * accident would lose it for good. On that step only the explicit button
	 * closes: escape, outside clicks and the X are blocked.
	 */
	const revealing = Boolean(created);

	return (
		<ResponsiveDialogDrawer
			className="max-w-xl!"
			description={
				created
					? `Guarde o segredo de "${created.name}" em local seguro.`
					: "A chave é sua e carrega as permissões do seu cargo."
			}
			dismissible={!revealing}
			icon={<KeyRound />}
			onOpenChange={handleOpenChange}
			open={open}
			title={created ? "Chave criada" : "Nova chave de API"}
			trigger={
				<Button>
					<Plus className="size-4" />
					Nova chave
				</Button>
			}
		>
			{created ? (
				<SecretReveal
					onDone={() => handleOpenChange(false)}
					secret={created.secret}
				/>
			) : (
				<CreateApiKeyForm onCreated={setCreated} />
			)}
		</ResponsiveDialogDrawer>
	);
}
