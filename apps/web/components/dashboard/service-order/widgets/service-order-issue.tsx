"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceOrderDetail } from "@/lib/services/service-orders";
import { useUpdateServiceOrder } from "../store";
import {
	ServiceOrderKeyValueItem,
	ServiceOrderKeyValueList,
} from "./service-order-key-value";

/** The reported issue and the internal notes, editable by who updates orders. */
export function ServiceOrderIssue({ order }: { order: ServiceOrderDetail }) {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const update = useUpdateServiceOrder(order.id);
	const toastError = useApiErrorToast();
	const [editing, setEditing] = useState(false);
	const [issue, setIssue] = useState(order.reportedDefect);
	const [notes, setNotes] = useState(order.observations ?? "");

	async function save() {
		try {
			await update.mutateAsync({
				reportedDefect: issue,
				observations: notes.trim() ? notes : null,
			});
			toast.success({ text: t("serviceOrders.detail.saved") });
			setEditing(false);
		} catch (error) {
			toastError(error);
		}
	}

	if (editing) {
		return (
			<div className="space-y-3">
				<div className="space-y-1">
					<Label className="text-muted-foreground" htmlFor="order-issue">
						{t("serviceOrders.fields.description")}
					</Label>
					<Textarea
						id="order-issue"
						onChange={(e) => setIssue(e.target.value)}
						value={issue}
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-muted-foreground" htmlFor="order-notes">
						{t("serviceOrders.fields.notes")}
					</Label>
					<Textarea
						id="order-notes"
						onChange={(e) => setNotes(e.target.value)}
						value={notes}
					/>
				</div>
				<div className="flex justify-end gap-2">
					<Button onClick={() => setEditing(false)} size="sm" variant="ghost">
						{t("serviceOrders.detail.cancelEdit")}
					</Button>
					<Button
						disabled={update.isPending || !issue.trim()}
						onClick={save}
						size="sm"
					>
						{t("serviceOrders.detail.saveIssue")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<ServiceOrderKeyValueList>
				<ServiceOrderKeyValueItem
					label={t("serviceOrders.fields.description")}
					stacked
					value={order.reportedDefect}
				/>
				{order.observations && (
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.notes")}
						stacked
						value={order.observations}
					/>
				)}
			</ServiceOrderKeyValueList>
			{ability.can(permissions.serviceOrders.update) && (
				<Button
					className="w-full"
					onClick={() => {
						setIssue(order.reportedDefect);
						setNotes(order.observations ?? "");
						setEditing(true);
					}}
					size="sm"
					variant="outline"
				>
					<Pencil className="size-3.5" />
					{t("serviceOrders.detail.editIssue")}
				</Button>
			)}
		</div>
	);
}
