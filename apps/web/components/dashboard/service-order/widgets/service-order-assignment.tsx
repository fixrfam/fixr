"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import { ArrowRight, Loader2, UserRoundCog } from "lucide-react";
import { useState } from "react";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import {
	useEmployeeOptions,
	useSectors,
} from "@/components/dashboard/sectors/store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ServiceOrderDetail } from "@/lib/services/service-orders";
import { useAssignServiceOrder } from "../store";
import {
	ServiceOrderKeyValueItem,
	ServiceOrderKeyValueList,
} from "./service-order-key-value";

const NONE = "none";

function ReassignForm({
	order,
	onDone,
}: {
	order: ServiceOrderDetail;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const assign = useAssignServiceOrder(order.id);
	const toastError = useApiErrorToast();
	const { data: sectors = [] } = useSectors();
	const { data: employees = [] } = useEmployeeOptions();
	const [sectorId, setSectorId] = useState(order.sectorId);
	const [assigneeId, setAssigneeId] = useState(order.assigneeId);

	const unchanged =
		sectorId === order.sectorId && assigneeId === order.assigneeId;
	// The sector's people first: they are the usual pick.
	const sorted = [...employees].sort(
		(a, b) =>
			Number(b.sectorId === sectorId) - Number(a.sectorId === sectorId) ||
			a.name.localeCompare(b.name)
	);

	function pickAssignee(id: string | null) {
		setAssigneeId(id);
		// Picking someone from another sector brings the order to their sector.
		const employee = employees.find((option) => option.id === id);
		if (employee?.sectorId) {
			setSectorId(employee.sectorId);
		}
	}

	async function submit() {
		try {
			await assign.mutateAsync({ sectorId, assigneeId });
			toast.success({ text: t("serviceOrders.assignment.changed") });
			onDone();
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<form
			className="grid gap-4"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<div className="grid gap-2">
				<Label htmlFor="assign-sector">
					{t("serviceOrders.assignment.sector")}
				</Label>
				<Select
					onValueChange={(value) => setSectorId(value === NONE ? null : value)}
					value={sectorId ?? NONE}
				>
					<SelectTrigger className="w-full" id="assign-sector">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={NONE}>
							{t("serviceOrders.assignment.noSector")}
						</SelectItem>
						{sectors.map((sector) => (
							<SelectItem key={sector.id} value={sector.id}>
								{sector.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="assign-employee">
					{t("serviceOrders.assignment.assignee")}
				</Label>
				<Select
					onValueChange={(value) => pickAssignee(value === NONE ? null : value)}
					value={assigneeId ?? NONE}
				>
					<SelectTrigger className="w-full" id="assign-employee">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={NONE}>
							{t("serviceOrders.assignment.noAssignee")}
						</SelectItem>
						{sorted.map((employee) => (
							<SelectItem key={employee.id} value={employee.id}>
								{employee.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Button
				className="w-full"
				disabled={unchanged || assign.isPending}
				size="lg"
				type="submit"
			>
				{unchanged
					? t("serviceOrders.assignment.sameAsNow")
					: t("serviceOrders.assignment.submit")}
				{assign.isPending ? (
					<Loader2 className="animate-spin" />
				) : (
					<UserRoundCog />
				)}
			</Button>
		</form>
	);
}

/** The card header's reassign button; nothing without `serviceOrders:assign`. */
export function ReassignDialog({ order }: { order: ServiceOrderDetail }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const canAssign = useCatalogAbility().can(permissions.serviceOrders.assign);

	if (!canAssign) {
		return null;
	}

	return (
		<ResponsiveDialogDrawer
			className="max-w-md!"
			description={t("serviceOrders.assignment.reassignDescription")}
			icon={<UserRoundCog />}
			onOpenChange={setOpen}
			open={open}
			title={t("serviceOrders.assignment.reassignTitle")}
			trigger={
				<Button size="sm" type="button" variant="ghost">
					<UserRoundCog className="size-3.5" />
					{t("serviceOrders.assignment.reassign")}
				</Button>
			}
		>
			{open && <ReassignForm onDone={() => setOpen(false)} order={order} />}
		</ResponsiveDialogDrawer>
	);
}

/**
 * Who has the order (sector and employee), who opened it, and every
 * reassignment. Reassigning lives in the card header ({@link ReassignDialog}).
 */
export function ServiceOrderAssignment({
	order,
}: {
	order: ServiceOrderDetail;
}) {
	const { t, format } = useTranslation();
	const history = [...order.assignments].reverse();

	return (
		<div className="space-y-4">
			<ServiceOrderKeyValueList>
				<ServiceOrderKeyValueItem
					label={t("serviceOrders.assignment.sector")}
					value={order.sector?.name ?? t("serviceOrders.assignment.noSector")}
				/>
				<ServiceOrderKeyValueItem
					label={t("serviceOrders.assignment.assignee")}
					value={
						order.assignee?.name ?? t("serviceOrders.assignment.noAssignee")
					}
				/>
				<ServiceOrderKeyValueItem
					label={t("serviceOrders.assignment.openedBy")}
					value={order.employee.name}
				/>
			</ServiceOrderKeyValueList>

			<div className="space-y-2">
				<p className="font-medium text-xs">
					{t("serviceOrders.assignment.history")}
				</p>
				{history.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						{t("serviceOrders.assignment.noHistory")}
					</p>
				) : (
					<ol className="space-y-2">
						{history.map((entry) => (
							<li className="grid gap-0.5 text-xs" key={entry.id}>
								<span className="flex flex-wrap items-center gap-1">
									{[entry.fromSector?.name, entry.fromAssignee?.name]
										.filter(Boolean)
										.join(" · ") || t("serviceOrders.assignment.nobody")}
									<ArrowRight className="size-3 text-muted-foreground" />
									<span className="font-medium">
										{[entry.toSector?.name, entry.toAssignee?.name]
											.filter(Boolean)
											.join(" · ") || t("serviceOrders.assignment.nobody")}
									</span>
								</span>
								<span className="text-muted-foreground">
									{format.dateTime(entry.createdAt)} ·{" "}
									{entry.employee
										? t("serviceOrders.assignment.by", {
												name: entry.employee.name,
											})
										: t("serviceOrders.assignment.byStage")}
								</span>
							</li>
						))}
					</ol>
				)}
			</div>
		</div>
	);
}
