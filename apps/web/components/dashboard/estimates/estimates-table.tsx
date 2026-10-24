"use client";

import { useTranslation } from "@fixr/i18n/react";
import { createAbility, permissions } from "@fixr/permissions";
import { useQuery } from "@tanstack/react-query";
import {
	Ban,
	Check,
	FileText,
	Mail,
	MoreHorizontal,
	Send,
	Trash2,
	Undo2,
	UserRoundCheck,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/hooks/use-session";
import {
	type Estimate,
	type EstimateStatus,
	estimatesApi,
} from "@/lib/services/estimates";
import { SendPortalAccessDialog } from "../clients/send-portal-access-dialog";
import { EstimateStatusBadge } from "./estimate-status-badge";
import { SendEstimateDialog } from "./send-estimate-dialog";
import {
	estimatesKey,
	useEstimateActions,
	useOpenEstimatePdf,
} from "./use-estimate-actions";

const STATUSES: EstimateStatus[] = ["draft", "sent", "approved", "rejected"];
const ALL = "all";

/** Status changes offered from each status (mirrors the API transitions). */
const NEXT_STATUSES: Record<EstimateStatus, EstimateStatus[]> = {
	draft: ["sent"],
	sent: ["approved", "rejected", "draft"],
	approved: [],
	rejected: ["draft"],
};

function EstimateActions({ estimate }: { estimate: Estimate }) {
	const { t } = useTranslation();
	const { session } = useSession();
	const ability = createAbility(session?.company?.role ?? "guest");
	const openPdf = useOpenEstimatePdf();
	const { updateStatus, remove } = useEstimateActions();

	const statusLabels: Record<
		EstimateStatus,
		{ label: string; Icon: typeof Send }
	> = {
		sent: { label: t("estimates.actions.send"), Icon: Send },
		approved: { label: t("estimates.actions.approve"), Icon: Check },
		rejected: { label: t("estimates.actions.reject"), Icon: Ban },
		draft: { label: t("estimates.actions.reopen"), Icon: Undo2 },
	};
	const canUpdate = ability.can(permissions.estimates.update);
	const canDelete =
		ability.can(permissions.estimates.delete) && estimate.status === "draft";
	const canSend =
		ability.can(permissions.estimates.sendToCustomer) &&
		(estimate.status === "draft" || estimate.status === "sent");
	const canSendPortalAccess =
		ability.can(permissions.customers.update) && estimate.client !== null;
	const [sending, setSending] = useState(false);
	const [sendingPortal, setSendingPortal] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						aria-label={t("estimates.actions.menu", {
							number: String(estimate.number).padStart(4, "0"),
						})}
						size="icon"
						variant="ghost"
					>
						<MoreHorizontal className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={() => openPdf(estimate.id)}>
						<FileText className="size-4" />
						{t("estimates.actions.openPdf")}
					</DropdownMenuItem>
					{canSend ? (
						<DropdownMenuItem onSelect={() => setSending(true)}>
							<Mail className="size-4" />
							{estimate.status === "sent"
								? t("estimates.actions.resendToClient")
								: t("estimates.actions.sendToClient")}
						</DropdownMenuItem>
					) : null}
					{canSendPortalAccess ? (
						<DropdownMenuItem onSelect={() => setSendingPortal(true)}>
							<UserRoundCheck className="size-4" />
							{t("portal.shopActions.sendAccess")}
						</DropdownMenuItem>
					) : null}
					{canUpdate
						? NEXT_STATUSES[estimate.status].map((status) => {
								const { label, Icon } = statusLabels[status];
								return (
									<DropdownMenuItem
										key={status}
										onSelect={() =>
											updateStatus.mutate({ id: estimate.id, status })
										}
									>
										<Icon className="size-4" />
										{label}
									</DropdownMenuItem>
								);
							})
						: null}
					{canDelete ? (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive"
								onSelect={() => remove.mutate(estimate.id)}
							>
								<Trash2 className="size-4" />
								{t("estimates.actions.delete")}
							</DropdownMenuItem>
						</>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>
			{sending ? (
				<SendEstimateDialog
					estimate={estimate}
					onOpenChange={setSending}
					open={sending}
				/>
			) : null}
			{sendingPortal && estimate.client ? (
				<SendPortalAccessDialog
					client={estimate.client}
					onOpenChange={setSendingPortal}
					open={sendingPortal}
				/>
			) : null}
		</>
	);
}

export function EstimatesTable() {
	const { t, format } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();
	const [status, setStatus] = useState<EstimateStatus | typeof ALL>(ALL);
	const [page, setPage] = useState(1);

	const { data, isPending } = useQuery({
		queryKey: [...estimatesKey(subdomain), status, page],
		queryFn: () =>
			estimatesApi.list(subdomain, page, status === ALL ? undefined : status),
	});

	const records = data?.records ?? [];
	const pagination = data?.pagination;

	return (
		<div className="space-y-4">
			<Select
				onValueChange={(value) => {
					setStatus(value as EstimateStatus | typeof ALL);
					setPage(1);
				}}
				value={status}
			>
				<SelectTrigger className="w-48">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>
						{t("estimates.table.allStatuses")}
					</SelectItem>
					{STATUSES.map((value) => (
						<SelectItem key={value} value={value}>
							{t(`estimates.status.${value}`)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{isPending ? (
				<Skeleton className="h-96 w-full rounded-md" />
			) : (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("estimates.table.headers.number")}</TableHead>
								<TableHead>{t("estimates.table.headers.client")}</TableHead>
								<TableHead>{t("estimates.table.headers.status")}</TableHead>
								<TableHead className="text-right">
									{t("estimates.table.headers.total")}
								</TableHead>
								<TableHead>{t("estimates.table.headers.validUntil")}</TableHead>
								<TableHead className="w-12">
									<span className="sr-only">
										{t("estimates.table.headers.actions")}
									</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{records.length === 0 ? (
								<TableRow>
									<TableCell
										className="h-24 text-center text-muted-foreground"
										colSpan={6}
									>
										{t("estimates.table.empty")}
									</TableCell>
								</TableRow>
							) : (
								records.map((estimate) => (
									<TableRow key={estimate.id}>
										<TableCell className="font-medium tabular-nums">
											#{String(estimate.number).padStart(4, "0")}
										</TableCell>
										<TableCell>
											{estimate.client?.name ?? (
												<span className="text-muted-foreground">
													{t("estimates.table.noClient")}
												</span>
											)}
										</TableCell>
										<TableCell>
											<EstimateStatusBadge status={estimate.status} />
											{estimate.rejectionReason ? (
												<p
													className="mt-1 max-w-56 truncate text-muted-foreground text-xs"
													title={estimate.rejectionReason}
												>
													{estimate.rejectionReason}
												</p>
											) : null}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{format.currency(estimate.totals.total)}
										</TableCell>
										<TableCell className="tabular-nums">
											{format.date(estimate.validUntil)}
										</TableCell>
										<TableCell>
											<EstimateActions estimate={estimate} />
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{pagination && pagination.total_pages > 1 ? (
				<div className="flex items-center justify-end gap-2 text-muted-foreground text-sm">
					<span>
						{t("estimates.table.pageOf", {
							page: pagination.current_page,
							total: pagination.total_pages,
						})}
					</span>
					<Button
						disabled={!pagination.prev_page}
						onClick={() => setPage((p) => p - 1)}
						size="sm"
						variant="outline"
					>
						{t("estimates.table.previous")}
					</Button>
					<Button
						disabled={!pagination.next_page}
						onClick={() => setPage((p) => p + 1)}
						size="sm"
						variant="outline"
					>
						{t("estimates.table.next")}
					</Button>
				</div>
			) : null}
		</div>
	);
}
