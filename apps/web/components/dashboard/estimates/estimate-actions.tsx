"use client";

import { useTranslation } from "@fixr/i18n/react";
import { createAbility, permissions } from "@fixr/permissions";
import {
	Ban,
	Check,
	FileText,
	Mail,
	MoreHorizontal,
	Send,
	Trash2,
	Undo2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/hooks/use-session";
import type { Estimate, EstimateStatus } from "@/lib/services/estimates";
import { SendEstimateDialog } from "./send-estimate-dialog";
import { formatEstimateNumber } from "./store";
import { useEstimateActions, useOpenEstimatePdf } from "./use-estimate-actions";

/** Status changes offered from each status (mirrors the API transitions). */
export const NEXT_STATUSES: Record<EstimateStatus, EstimateStatus[]> = {
	draft: ["sent"],
	sent: ["approved", "rejected", "draft"],
	approved: [],
	rejected: ["draft"],
};

/** Label and icon of the action that moves an estimate to each status. */
export function useStatusActions() {
	const { t } = useTranslation();
	return {
		sent: { label: t("estimates.actions.send"), Icon: Send },
		approved: { label: t("estimates.actions.approve"), Icon: Check },
		rejected: { label: t("estimates.actions.reject"), Icon: Ban },
		draft: { label: t("estimates.actions.reopen"), Icon: Undo2 },
	} satisfies Record<EstimateStatus, { label: string; Icon: typeof Send }>;
}

/** What the current session may do with an estimate. */
export function useEstimatePermissions(estimate: Estimate) {
	const { session } = useSession();
	const ability = createAbility(session?.company?.role ?? "guest");
	return {
		canUpdate: ability.can(permissions.estimates.update),
		canDelete:
			ability.can(permissions.estimates.delete) && estimate.status === "draft",
		/** By email, which also marks it as sent: drafts, or sent ones again. */
		canSend:
			ability.can(permissions.estimates.sendToCustomer) &&
			(estimate.status === "draft" || estimate.status === "sent"),
	};
}

/** The row menu of the estimates table. */
export function EstimateActionsMenu({ estimate }: { estimate: Estimate }) {
	const { t } = useTranslation();
	const openPdf = useOpenEstimatePdf();
	const { updateStatus, remove } = useEstimateActions();
	const statusActions = useStatusActions();
	const { canUpdate, canDelete, canSend } = useEstimatePermissions(estimate);
	const [sending, setSending] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						aria-label={t("estimates.actions.menu", {
							number: formatEstimateNumber(estimate.number),
						})}
						onClick={(event) => event.stopPropagation()}
						size="icon-sm"
						variant="ghost"
					>
						<MoreHorizontal className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					onClick={(event) => event.stopPropagation()}
				>
					<DropdownMenuItem onSelect={() => openPdf(estimate.id)}>
						<FileText className="size-4" />
						{t("estimates.actions.openPdf")}
					</DropdownMenuItem>
					{canSend ? (
						<DropdownMenuItem onSelect={() => setSending(true)}>
							<Mail className="size-4" />
							{estimate.status === "sent"
								? t("estimates.actions.resendToCustomer")
								: t("estimates.actions.sendToCustomer")}
						</DropdownMenuItem>
					) : null}
					{canUpdate
						? NEXT_STATUSES[estimate.status].map((status) => {
								const { label, Icon } = statusActions[status];
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
		</>
	);
}
