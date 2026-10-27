"use client";

import { useTranslation } from "@fixr/i18n/react";
import { deviceStatuses, deviceStatusFor } from "@fixr/schemas/devices";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { toast } from "@pheralb/toast";
import {
	ArrowRight,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Route,
	Smartphone,
	TriangleAlert,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { DeviceStatusBadge } from "@/components/dashboard/devices/device-status-badge";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import { Textarea } from "@/components/ui/textarea";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import type {
	ServiceOrderDetail,
	ServiceOrderStatus,
} from "@/lib/services/service-orders";
import { cn } from "@/lib/utils";
import { ServiceOrderStatusBadge } from "../service-order-status-badge";
import { useChangeServiceOrderStatus } from "../store";

const STATUSES = serviceOrderStatuses.options;
const DEVICE_STATUSES = deviceStatuses.options;
const NOTE_MAX = 500;

/**
 * Every option in the same grid cell, only `value` visible: the cell is as
 * wide as the widest option, so changing it never moves what's around it.
 */
function Swap<T extends string>({
	options,
	value,
	render,
	align = "center",
}: {
	options: readonly T[];
	value: T;
	render: (option: T) => ReactNode;
	align?: "start" | "center" | "end";
}) {
	return (
		<span
			className={cn(
				"grid",
				align === "start" && "justify-items-start",
				align === "center" && "justify-items-center",
				align === "end" && "justify-items-end"
			)}
		>
			{options.map((option) => (
				<span
					aria-hidden={option !== value}
					className={cn(
						"col-start-1 row-start-1 transition-[opacity,translate] duration-200 ease-out",
						option === value
							? "translate-y-0 opacity-100"
							: "pointer-events-none translate-y-1 opacity-0"
					)}
					key={option}
				>
					{render(option)}
				</span>
			))}
		</span>
	);
}

function OrderBadge({ status }: { status: ServiceOrderStatus }) {
	const { t } = useTranslation();
	return (
		<ServiceOrderStatusBadge
			className="whitespace-nowrap rounded-lg px-2 py-0.5 font-semibold text-xs"
			variant={status}
		>
			{t(serviceOrderStatusKeys[status])}
		</ServiceOrderStatusBadge>
	);
}

/** Before and after side by side, the arrow always in the middle. */
function ChangeRow({
	label,
	from,
	to,
	arrowClassName,
	flipped = false,
}: {
	label: ReactNode;
	from: ReactNode;
	to: ReactNode;
	arrowClassName?: string;
	flipped?: boolean;
}) {
	return (
		<div className="grid gap-1.5">
			<div className="text-muted-foreground text-xs">{label}</div>
			<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
				<div className="justify-self-start">{from}</div>
				<ArrowRight
					className={cn(
						"size-4 text-muted-foreground transition-[rotate,color] duration-200 ease-out",
						flipped && "rotate-180",
						arrowClassName
					)}
				/>
				<div className="justify-self-end">{to}</div>
			</div>
		</div>
	);
}

/** The lifecycle as a row of steps: where the order is and where it goes. */
function StatusTrack({
	current,
	target,
	onPick,
	onStep,
}: {
	current: number;
	target: number;
	onPick: (index: number) => void;
	onStep: (by: number) => void;
}) {
	const { t } = useTranslation();
	const from = Math.min(current, target);
	const to = Math.max(current, target);

	return (
		<div
			aria-label={t("serviceOrders.statusCard.stepsLabel")}
			className="flex items-center"
			onKeyDown={(e) => {
				if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
					e.preventDefault();
					onStep(e.key === "ArrowRight" ? 1 : -1);
				}
			}}
			role="radiogroup"
		>
			{STATUSES.map((status, index) => (
				<div
					className={cn("flex items-center", index > 0 && "flex-1")}
					key={status}
				>
					{index > 0 && (
						<span
							className={cn(
								"h-0.5 flex-1 transition-colors duration-200",
								index <= current && "bg-primary",
								index > current && index > from && index <= to
									? "bg-primary/40"
									: index > current && "bg-border"
							)}
						/>
					)}
					{/* biome-ignore lint/a11y/useSemanticElements: steps of a track, styled as dots; native radios can't take this shape */}
					<button
						aria-checked={index === target}
						aria-label={t(serviceOrderStatusKeys[status])}
						className={cn(
							"relative grid size-7 shrink-0 place-items-center rounded-full border font-medium text-[11px] tabular-nums transition-[background-color,border-color,color,box-shadow] duration-200",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							// A bigger target than the dot, without touching its neighbours.
							"after:absolute after:-inset-1.5",
							index < current && "border-primary bg-primary text-white",
							index === current && "border-primary bg-background text-primary",
							index > current && "bg-background text-muted-foreground",
							index === target &&
								"ring-2 ring-primary ring-offset-2 ring-offset-background"
						)}
						onClick={() => onPick(index)}
						role="radio"
						title={t(serviceOrderStatusKeys[status])}
						type="button"
					>
						{index + 1}
					</button>
				</div>
			))}
		</div>
	);
}

function MoveStatusForm({
	order,
	onDone,
}: {
	order: ServiceOrderDetail;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const changeStatus = useChangeServiceOrderStatus(order.id);
	const toastError = useApiErrorToast();
	const current = STATUSES.indexOf(order.status);
	// The next step is what usually happens; the last one has nowhere to go.
	const [target, setTarget] = useState(
		Math.min(current + 1, STATUSES.length - 1)
	);
	const [note, setNote] = useState("");

	const to = STATUSES[target] as ServiceOrderStatus;
	const unchanged = target === current;
	const backwards = target < current;
	const deviceFrom = order.device.status;
	const deviceTo = deviceStatusFor(to);

	function step(by: number) {
		setTarget((value) =>
			Math.min(Math.max(value + by, 0), STATUSES.length - 1)
		);
	}

	async function submit() {
		if (unchanged) {
			return;
		}
		try {
			await changeStatus.mutateAsync({
				status: to,
				note: note.trim() || null,
			});
			toast.success({ text: t("serviceOrders.statusCard.changed") });
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
			<div className="grid gap-4 rounded-2xl border p-4">
				<div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
					<Button
						aria-label={t("serviceOrders.statusCard.previousStep")}
						className="size-10 rounded-full active:scale-[0.96]"
						disabled={target === 0}
						onClick={() => step(-1)}
						size="icon"
						type="button"
						variant="outline"
					>
						<ChevronLeft />
					</Button>
					<div className="grid justify-items-center gap-0.5">
						<Swap
							options={STATUSES}
							render={(status) => (
								<span
									className={cn(
										"whitespace-nowrap font-semibold text-xl tracking-tight",
										status === order.status && "text-muted-foreground"
									)}
								>
									{t(serviceOrderStatusKeys[status])}
								</span>
							)}
							value={to}
						/>
						<span className="text-muted-foreground text-xs tabular-nums">
							{t("serviceOrders.statusCard.stepOf", {
								step: target + 1,
								total: STATUSES.length,
							})}
						</span>
					</div>
					<Button
						aria-label={t("serviceOrders.statusCard.nextStep")}
						className="size-10 rounded-full active:scale-[0.96]"
						disabled={target === STATUSES.length - 1}
						onClick={() => step(1)}
						size="icon"
						type="button"
						variant="outline"
					>
						<ChevronRight />
					</Button>
				</div>
				<StatusTrack
					current={current}
					onPick={setTarget}
					onStep={step}
					target={target}
				/>
			</div>

			<div
				aria-live="polite"
				className="grid gap-3 rounded-2xl bg-muted/50 p-4"
			>
				<ChangeRow
					arrowClassName={cn(
						!(unchanged || backwards) && "text-primary",
						backwards && "text-amber-600 dark:text-amber-400"
					)}
					flipped={backwards}
					from={<OrderBadge status={order.status} />}
					label={t("serviceOrders.statusCard.order")}
					to={
						<Swap
							align="end"
							options={STATUSES}
							render={(status) => <OrderBadge status={status} />}
							value={to}
						/>
					}
				/>
				<div className="h-px bg-border" />
				<ChangeRow
					arrowClassName={cn(deviceFrom !== deviceTo && "text-primary")}
					from={<DeviceStatusBadge status={deviceFrom} />}
					label={
						<span className="flex items-center gap-1.5">
							<Smartphone className="size-3.5" />
							{t("serviceOrders.statusCard.device")}
						</span>
					}
					to={
						<Swap
							align="end"
							options={DEVICE_STATUSES}
							render={(status) => <DeviceStatusBadge status={status} />}
							value={deviceTo}
						/>
					}
				/>
			</div>

			{backwards && (
				<p
					className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 text-sm dark:text-amber-300"
					role="alert"
				>
					<TriangleAlert className="size-4 shrink-0" />
					{t("serviceOrders.statusCard.backwards")}
				</p>
			)}

			<div className="grid gap-2">
				<Label htmlFor="status-note">
					{t("serviceOrders.statusCard.noteLabel")}
				</Label>
				<Textarea
					className="min-h-16"
					id="status-note"
					maxLength={NOTE_MAX}
					onChange={(e) => setNote(e.target.value)}
					placeholder={t("serviceOrders.statusCard.notePlaceholder")}
					value={note}
				/>
			</div>

			<Button
				className="w-full"
				disabled={unchanged || changeStatus.isPending}
				size="lg"
				type="submit"
			>
				{unchanged
					? t("serviceOrders.statusCard.submitSame")
					: t("serviceOrders.statusCard.submit", {
							status: t(serviceOrderStatusKeys[to]),
						})}
				{changeStatus.isPending ? (
					<Loader2 className="animate-spin" />
				) : (
					<Route />
				)}
			</Button>
		</form>
	);
}

/**
 * Moves an order through its lifecycle: step to the next status (or pick
 * any), see what happens to the order and the device, and leave a note for
 * the history.
 */
export function MoveStatusDialog({ order }: { order: ServiceOrderDetail }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	return (
		<ResponsiveDialogDrawer
			className="max-w-lg!"
			description={t("serviceOrders.statusCard.moveDescription")}
			icon={<Route />}
			onOpenChange={setOpen}
			open={open}
			title={t("serviceOrders.statusCard.moveTitle")}
			trigger={
				<Button className="w-full" type="button" variant="outline">
					<Route />
					{t("serviceOrders.statusCard.move")}
				</Button>
			}
		>
			{open && <MoveStatusForm onDone={() => setOpen(false)} order={order} />}
		</ResponsiveDialogDrawer>
	);
}
