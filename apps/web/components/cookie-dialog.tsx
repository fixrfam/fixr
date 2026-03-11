"use client";

import { toast } from "@pheralb/toast";
import { type ReactNode, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";

export default function CookieDialog({
	cookieKey,
	close,
	open,
	children,
}: {
	cookieKey: string;
	close: {
		cta: ReactNode;
		toast: {
			text: string;
			description: string;
		};
	};
	open: boolean;
	children: ReactNode;
}) {
	const [openDialog, setOpenDialog] = useState(open);

	if (open) {
		// biome-ignore lint/suspicious/noDocumentCookie: <TODO: Refactor to CookieStore API https://developer.mozilla.org/en-US/docs/Web/API/CookieStore>
		document.cookie = `${cookieKey}=; max-age=0; path=/`;
	}

	const openChangeHandler = (bool: boolean) => {
		setOpenDialog(bool);
		toast.info({
			text: close.toast.text,
			description: close.toast.description,
		});
	};

	return (
		<Dialog onOpenChange={(bool) => openChangeHandler(bool)} open={openDialog}>
			<DialogContent>
				{children}
				<Button className="mx-auto" onClick={() => setOpenDialog(false)}>
					{close.cta}
				</Button>
			</DialogContent>
		</Dialog>
	);
}
