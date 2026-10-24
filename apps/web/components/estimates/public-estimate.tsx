"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import { rejectEstimateSchema } from "@fixr/schemas/estimates";
import { toast } from "@pheralb/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileDown, LayoutList, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EstimateStatusBadge } from "@/components/dashboard/estimates/estimate-status-badge";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	type PublicEstimate as Estimate,
	estimateLinksApi,
} from "@/lib/services/estimates";
import { portalApi } from "@/lib/services/portal";

const REASON_MAX = 500;

function StatusNotice({ estimate }: { estimate: Estimate }) {
	const { t, format } = useTranslation();
	const respondedAt = estimate.respondedAt
		? format.date(estimate.respondedAt)
		: "";

	if (estimate.status === "approved") {
		return (
			<Alert>
				<Check className="size-4" />
				<AlertDescription>
					{t("estimates.public.approved", { date: respondedAt })}
				</AlertDescription>
			</Alert>
		);
	}
	if (estimate.status === "rejected") {
		return (
			<Alert>
				<X className="size-4" />
				<AlertDescription>
					{t("estimates.public.rejected", { date: respondedAt })}
				</AlertDescription>
			</Alert>
		);
	}
	if (estimate.expired) {
		return (
			<Alert variant="destructive">
				<AlertDescription>
					{t("estimates.public.expired", {
						date: format.date(estimate.validUntil),
					})}
				</AlertDescription>
			</Alert>
		);
	}
	return null;
}

export function RejectDialog({
	number,
	open,
	pending,
	onOpenChange,
	onConfirm,
}: {
	number: string;
	open: boolean;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (reason: string) => void;
}) {
	const { t } = useTranslation();
	const [reason, setReason] = useState("");
	const valid = rejectEstimateSchema.safeParse({ reason }).success;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("estimates.public.rejectTitle", { number })}
					</DialogTitle>
					<DialogDescription>
						{t("estimates.public.rejectDescription")}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="rejection-reason">
						{t("estimates.public.reasonLabel")}
					</Label>
					<Textarea
						id="rejection-reason"
						maxLength={REASON_MAX}
						onChange={(event) => setReason(event.target.value)}
						placeholder={t("estimates.public.reasonPlaceholder")}
						value={reason}
					/>
				</div>
				<DialogFooter>
					<Button
						onClick={() => onOpenChange(false)}
						type="button"
						variant="outline"
					>
						{t("estimates.public.cancel")}
					</Button>
					<Button
						disabled={pending || !valid}
						onClick={() => onConfirm(reason.trim())}
						variant="destructive"
					>
						{pending ? <Loader2 className="size-4 animate-spin" /> : null}
						{t("estimates.public.confirmReject")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** The estimate as the client sees it, with the approve and reject actions. */
export function PublicEstimate({ token }: { token: string }) {
	const { t, format } = useTranslation();
	const message = useMessage();
	const toastError = useApiErrorToast();
	const queryClient = useQueryClient();
	const [rejecting, setRejecting] = useState(false);
	const router = useRouter();
	const queryKey = ["estimate-link", token];

	const openPortal = useMutation({
		mutationFn: () => portalApi.openFromEstimate(token),
		onSuccess: () => router.push("/portal"),
		onError: toastError,
	});

	const {
		data: estimate,
		isPending,
		isError,
	} = useQuery({
		queryKey,
		queryFn: () => estimateLinksApi.get(token),
		retry: false,
	});

	const answer = useMutation({
		mutationFn: (
			value: { approve: true } | { approve: false; reason: string }
		) =>
			value.approve
				? estimateLinksApi.approve(token)
				: estimateLinksApi.reject(token, { reason: value.reason || undefined }),
		onSuccess: (updated, value) => {
			queryClient.setQueryData(queryKey, updated);
			setRejecting(false);
			const feedback = message(
				value.approve ? "approve_estimate_success" : "reject_estimate_success",
				"success"
			);
			toast.success({
				text: feedback.title,
				description: feedback.description,
			});
		},
		onError: (error) => {
			toastError(error);
			queryClient.invalidateQueries({ queryKey });
		},
	});

	if (isPending) {
		return <Skeleton className="h-[32rem] w-full max-w-3xl rounded-lg" />;
	}

	if (isError || !estimate) {
		return (
			<section className="w-full max-w-xl space-y-2 pt-10 text-center">
				<h1 className="font-heading font-semibold text-2xl">
					{t("estimates.public.invalidTitle")}
				</h1>
				<p className="text-muted-foreground">
					{t("estimates.public.invalidDescription")}
				</p>
			</section>
		);
	}

	const number = String(estimate.number).padStart(4, "0");
	const canAnswer = estimate.status === "sent" && !estimate.expired;

	return (
		<article className="w-full max-w-3xl space-y-6 rounded-lg border bg-card p-4 md:p-8">
			<header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="flex items-center gap-3">
					{estimate.company.logoUrl ? (
						<img
							alt={estimate.company.name}
							className="size-12 rounded-md border object-contain"
							height={48}
							src={estimate.company.logoUrl}
							width={48}
						/>
					) : null}
					<div>
						<h1 className="font-heading font-semibold text-2xl">
							{t("estimates.public.title", { number })}
						</h1>
						<p className="text-muted-foreground text-sm">
							{t("estimates.public.issuedBy", {
								company: estimate.company.name,
							})}
						</p>
					</div>
				</div>
				<div className="flex flex-col items-start gap-1 md:items-end">
					<EstimateStatusBadge status={estimate.status} />
					<span className="text-muted-foreground text-sm">
						{t("estimates.public.validUntil", {
							date: format.date(estimate.validUntil),
						})}
					</span>
				</div>
			</header>

			<StatusNotice estimate={estimate} />

			<section className="space-y-1">
				<h2 className="font-medium text-sm">{t("estimates.public.device")}</h2>
				<p className="text-muted-foreground text-sm">
					{estimate.device.maker} {estimate.device.model}
				</p>
				<p className="text-muted-foreground text-sm">
					{estimate.device.reportedDefect}
				</p>
			</section>

			<section className="space-y-2">
				<h2 className="font-medium text-sm">{t("estimates.public.items")}</h2>
				<div className="overflow-x-auto rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("estimates.pdf.headers.item")}</TableHead>
								<TableHead>{t("estimates.pdf.headers.type")}</TableHead>
								<TableHead className="text-right">
									{t("estimates.pdf.headers.quantity")}
								</TableHead>
								<TableHead className="text-right">
									{t("estimates.pdf.headers.unitPrice")}
								</TableHead>
								<TableHead className="text-right">
									{t("estimates.pdf.headers.total")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{estimate.items.map((item, index) => (
								<TableRow key={`${item.name}-${index}`}>
									<TableCell>{item.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{t(`estimates.pdf.${item.type}`)}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{item.quantity}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{format.currency(item.unitPrice)}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{format.currency(item.total)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</section>

			<dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
				<div className="flex justify-between">
					<dt className="text-muted-foreground">
						{t("estimates.pdf.subtotal")}
					</dt>
					<dd className="tabular-nums">
						{format.currency(estimate.totals.subtotal)}
					</dd>
				</div>
				{estimate.totals.discount > 0 ? (
					<div className="flex justify-between">
						<dt className="text-muted-foreground">
							{t("estimates.pdf.discount", {
								percentage: estimate.discountPercentage,
							})}
						</dt>
						<dd className="tabular-nums">
							- {format.currency(estimate.totals.discount)}
						</dd>
					</div>
				) : null}
				<Separator />
				<div className="flex justify-between font-semibold text-base">
					<dt>{t("estimates.pdf.total")}</dt>
					<dd className="tabular-nums">
						{format.currency(estimate.totals.total)}
					</dd>
				</div>
			</dl>

			{estimate.notes ? (
				<section className="space-y-1">
					<h2 className="font-medium text-sm">{t("estimates.public.notes")}</h2>
					<p className="whitespace-pre-line text-muted-foreground text-sm">
						{estimate.notes}
					</p>
				</section>
			) : null}

			<footer className="flex flex-col-reverse gap-2 md:flex-row md:justify-between">
				<div className="flex flex-col gap-2 md:flex-row">
					<Button asChild variant="outline">
						<a
							href={estimateLinksApi.pdfUrl(token)}
							rel="noopener"
							target="_blank"
						>
							<FileDown className="size-4" />
							{t("estimates.public.downloadPdf")}
						</a>
					</Button>
					<Button
						disabled={openPortal.isPending}
						onClick={() => openPortal.mutate()}
						variant="ghost"
					>
						<LayoutList className="size-4" />
						{t("portal.fromEstimate")}
					</Button>
				</div>
				{canAnswer ? (
					<div className="flex flex-col-reverse gap-2 md:flex-row">
						<Button
							disabled={answer.isPending}
							onClick={() => setRejecting(true)}
							variant="outline"
						>
							<X className="size-4" />
							{t("estimates.public.reject")}
						</Button>
						<Button
							disabled={answer.isPending}
							onClick={() => answer.mutate({ approve: true })}
						>
							{answer.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Check className="size-4" />
							)}
							{t("estimates.public.approve")}
						</Button>
					</div>
				) : null}
			</footer>

			<RejectDialog
				number={number}
				onConfirm={(reason) => answer.mutate({ approve: false, reason })}
				onOpenChange={setRejecting}
				open={rejecting}
				pending={answer.isPending}
			/>
		</article>
	);
}
