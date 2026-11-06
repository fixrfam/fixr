"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Download, ExternalLink, FileWarning, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Estimate } from "@/lib/services/estimates";
import { formatEstimateNumber, useEstimatePdf } from "./store";

/** The estimate's PDF, rendered by the API, embedded with download and new tab links. */
export function EstimatePdfViewer({ estimate }: { estimate: Estimate }) {
	const { t } = useTranslation();
	const pdf = useEstimatePdf(estimate.id, estimate.updatedAt);
	const url = pdf.data;
	const number = formatEstimateNumber(estimate.number);

	useEffect(() => {
		return () => {
			if (url) {
				URL.revokeObjectURL(url);
			}
		};
	}, [url]);

	return (
		<div className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-lg border bg-muted/30">
			<div className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2">
				<span className="font-medium text-2xs">
					{t("estimates.detail.pdf")}
				</span>
				{url && (
					<div className="flex items-center gap-1">
						<Button asChild size="sm" variant="ghost">
							<a
								download={t("estimates.pdf.fileName", {
									number: String(estimate.number).padStart(4, "0"),
								})}
								href={url}
							>
								<Download className="size-3.5" />
								{t("estimates.detail.download")}
							</a>
						</Button>
						<Button asChild size="sm" variant="ghost">
							<a href={url} rel="noopener" target="_blank">
								<ExternalLink className="size-3.5" />
								{t("estimates.detail.openInTab")}
							</a>
						</Button>
					</div>
				)}
			</div>
			{url ? (
				<iframe
					className="w-full flex-1 bg-white"
					src={`${url}#view=FitH`}
					title={t("estimates.detail.pdfTitle", { number })}
				/>
			) : (
				<div className="grid flex-1 place-items-center p-6 text-center text-muted-foreground text-xs">
					{pdf.isError ? (
						<span className="flex flex-col items-center gap-2">
							<FileWarning className="size-6" />
							{t("estimates.detail.pdfError")}
						</span>
					) : (
						<span className="flex flex-col items-center gap-2">
							<Loader2 className="size-6 animate-spin" />
							{t("estimates.detail.pdfLoading")}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
