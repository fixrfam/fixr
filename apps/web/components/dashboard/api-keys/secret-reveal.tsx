"use client";

import { useTranslation } from "@fixr/i18n/react";
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
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(secret);
			setCopied(true);
			toast.success({ text: t("apiKeys.secret.copied") });
		} catch {
			toast.error({
				text: t("apiKeys.secret.copyFailedTitle"),
				description: t("apiKeys.secret.copyFailedDescription"),
			});
		}
	}

	return (
		<div className="space-y-5">
			<Alert variant="warning">
				<TriangleAlert />
				<AlertTitle>{t("apiKeys.secret.warningTitle")}</AlertTitle>
				<AlertDescription>
					{t("apiKeys.secret.warningDescription")}
				</AlertDescription>
			</Alert>

			<div className="space-y-2">
				<p className="font-medium text-sm">{t("apiKeys.secret.label")}</p>
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
						<span className="sr-only">{t("apiKeys.secret.copy")}</span>
					</Button>
				</div>
				<p className="text-muted-foreground text-xs">
					{t("apiKeys.secret.usageBefore")} <code>x-api-key</code>{" "}
					{t("apiKeys.secret.usageBetween")}{" "}
					<code>
						Authorization: Bearer &lt;{t("apiKeys.secret.secretWord")}&gt;
					</code>
					.
				</p>
			</div>

			<Button className="w-full" onClick={onDone} type="button">
				{t("apiKeys.secret.done")}
			</Button>
		</div>
	);
}
