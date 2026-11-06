"use client";

import { useTranslation } from "@fixr/i18n/react";
import { rejectEstimateSchema } from "@fixr/schemas/estimates";
import {
	CalendarClock,
	Check,
	ChevronDown,
	ExternalLink,
	FileText,
	Globe,
	Loader2,
	Mail,
	Phone,
	X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { daysUntil } from "@/components/dashboard/estimates/store";
import { ModelImage } from "@/components/dashboard/models/model-image";
import { FixrLoader } from "@/components/fixr-loader";
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
import { Textarea } from "@/components/ui/textarea";
import { Wallpaper } from "@/components/wallpaper";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import type { PublicEstimate } from "@/lib/services/estimates";
import { cn } from "@/lib/utils";

const REASON_MAX = 500;

export interface CustomerEstimateProps {
	estimate: PublicEstimate;
	/** Where the PDF is served (a direct URL: the credential goes with it). */
	pdfUrl: string;
	pending: boolean;
	onApprove: () => void;
	onReject: (reason: string) => void;
	/** Shown above the content, e.g. a way back in the portal. */
	header?: ReactNode;
	/** Leaves room for a bottom navigation under the action bar. */
	withBottomNav?: boolean;
}

/**
 * An estimate as the client sees it: the shop, the total and its validity,
 * the device and service order it is about, what will be done, the PDF and
 * the answer. Mobile first: the answer stays at the bottom of the screen.
 */
export function CustomerEstimate({
	estimate,
	pdfUrl,
	pending,
	onApprove,
	onReject,
	header,
	withBottomNav = false,
}: CustomerEstimateProps) {
	const { t } = useTranslation();
	const [rejecting, setRejecting] = useState(false);
	const number = String(estimate.number).padStart(4, "0");
	const canAnswer = estimate.status === "sent" && !estimate.expired;

	return (
		<div className={cn("w-full", canAnswer && "pb-28 lg:pb-0")}>
			{header}
			<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
				<div className="min-w-0 space-y-5">
					<Hero estimate={estimate} number={number} />
					<StatusNotice estimate={estimate} />
					<DeviceSection estimate={estimate} />
					<ItemsSection estimate={estimate} />
					{estimate.notes && (
						<Section title={t("estimates.public.notes")}>
							<p className="whitespace-pre-line text-muted-foreground text-sm">
								{estimate.notes}
							</p>
						</Section>
					)}
					<div className="lg:hidden">
						<PdfSection collapsible number={number} url={pdfUrl} />
					</div>
					<ContactSection company={estimate.company} />
				</div>
				<div className="hidden lg:block">
					<div className="sticky top-6 h-[min(85dvh,60rem)]">
						<PdfSection number={number} url={pdfUrl} />
					</div>
				</div>
			</div>

			{canAnswer && (
				<div
					className={cn(
						"fixed inset-x-0 z-30 px-4 lg:static lg:mt-6 lg:px-0",
						withBottomNav ? "bottom-24" : "bottom-4"
					)}
				>
					<div className="mx-auto flex max-w-xl items-center gap-2 rounded-[1.75rem] bg-background/90 p-1.5 shadow-[0_0_0_1px_oklch(0_0_0/0.06),0_8px_24px_-6px_oklch(0_0_0/0.25)] backdrop-blur-xl lg:ml-0 lg:max-w-none lg:justify-end lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-[0_0_0_1px_oklch(1_0_0/0.1),0_8px_24px_-6px_oklch(0_0_0/0.6)]">
						<span className="hidden flex-1 text-muted-foreground text-sm lg:block">
							{t("estimates.public.answerPrompt")}
						</span>
						<Button
							className="flex-1 rounded-full transition-[scale] active:scale-[0.96] lg:flex-none"
							disabled={pending}
							onClick={() => setRejecting(true)}
							size="lg"
							variant="outline"
						>
							<X className="size-4" />
							{t("estimates.public.reject")}
						</Button>
						<Button
							className="flex-[2] rounded-full transition-[scale] active:scale-[0.96] lg:flex-none"
							disabled={pending}
							onClick={onApprove}
							size="lg"
						>
							{pending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Check className="size-4" />
							)}
							{t("estimates.public.approve")}
						</Button>
					</div>
				</div>
			)}

			<RejectDialog
				number={number}
				onConfirm={(reason) => {
					onReject(reason);
					setRejecting(false);
				}}
				onOpenChange={setRejecting}
				open={rejecting}
				pending={pending}
			/>
		</div>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="space-y-2.5">
			<h2 className="font-semibold text-sm">{title}</h2>
			{children}
		</section>
	);
}

function Hero({
	estimate,
	number,
}: {
	estimate: PublicEstimate;
	number: string;
}) {
	const { t, format } = useTranslation();
	const days = daysUntil(estimate.validUntil);
	const open = estimate.status === "sent" && !estimate.expired;

	return (
		<Wallpaper className="rounded-[1.25rem] p-4">
			<header className="flex items-center gap-3">
				{estimate.company.logoUrl ? (
					<img
						alt=""
						className="size-9 shrink-0 rounded-lg bg-white object-contain"
						height={36}
						src={estimate.company.logoUrl}
						width={36}
					/>
				) : (
					<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white font-semibold text-[#050b1f] text-sm">
						{estimate.company.name.charAt(0).toUpperCase()}
					</span>
				)}
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium text-sm">
						{estimate.company.name}
					</p>
					<p className="whitespace-nowrap text-white/70 text-xs">
						{t("estimates.public.title", { number })}
					</p>
				</div>
				<span className="shrink-0 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1 font-semibold text-xs backdrop-blur">
					{t(`estimates.status.${estimate.status}`)}
				</span>
			</header>
			<div className="mt-6">
				<p className="text-white/70 text-xs">{t("estimates.public.total")}</p>
				<p className="font-heading font-semibold text-4xl tracking-tight">
					{format.currency(estimate.totals.total)}
				</p>
				{estimate.totals.discount > 0 && (
					<p className="mt-0.5 whitespace-nowrap text-sm">
						<s className="text-white/60">
							{format.currency(estimate.totals.subtotal)}
						</s>{" "}
						<span className="font-medium text-emerald-300">
							{t("estimates.table.discount", {
								percentage: format.number(estimate.discountPercentage),
							})}
						</span>
					</p>
				)}
			</div>
			<p
				className={cn(
					"mt-4 flex items-center gap-1.5 whitespace-nowrap text-xs",
					open && days <= 3 ? "text-amber-300" : "text-white/70"
				)}
			>
				<CalendarClock className="size-3.5 shrink-0" />
				{t("estimates.public.validFor", {
					date: format.date(estimate.validUntil),
				})}
				{open && days >= 0 && days <= 7 && (
					<span>
						·{" "}
						{days === 0
							? t("estimates.public.lastDay")
							: t("estimates.public.daysLeft", { days })}
					</span>
				)}
			</p>
		</Wallpaper>
	);
}

function StatusNotice({ estimate }: { estimate: PublicEstimate }) {
	const { t, format } = useTranslation();
	const respondedAt = estimate.respondedAt
		? format.date(estimate.respondedAt)
		: "";

	let tone = "";
	let icon: ReactNode = null;
	let text = "";
	if (estimate.status === "approved") {
		tone =
			"border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
		icon = <Check className="size-4 shrink-0" />;
		text = t("estimates.public.approved", { date: respondedAt });
	} else if (estimate.status === "rejected") {
		tone = "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200";
		icon = <X className="size-4 shrink-0" />;
		text = t("estimates.public.rejected", { date: respondedAt });
	} else if (estimate.expired) {
		tone =
			"border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
		icon = <CalendarClock className="size-4 shrink-0" />;
		text = t("estimates.public.expired", {
			date: format.date(estimate.validUntil),
		});
	} else {
		return null;
	}

	return (
		<output
			className={cn(
				"flex items-start gap-2.5 rounded-xl border p-3 text-sm",
				tone
			)}
		>
			<span className="mt-0.5">{icon}</span>
			<div>
				<p>{text}</p>
				{estimate.rejectionReason && (
					<p className="mt-1 text-xs opacity-80">
						“{estimate.rejectionReason}”
					</p>
				)}
			</div>
		</output>
	);
}

function DeviceSection({ estimate }: { estimate: PublicEstimate }) {
	const { t, format } = useTranslation();
	const { device, serviceOrder } = estimate;

	return (
		<Section title={t("estimates.public.yourDevice")}>
			<div>
				<div className="flex items-center gap-3">
					<ModelImage
						alt={device.model}
						category={device.category}
						className="size-16 rounded-xl"
						src={device.imageUrl}
					/>
					<div className="min-w-0 flex-1">
						<p className="truncate font-semibold">{device.model}</p>
						<p className="text-muted-foreground text-sm">{device.maker}</p>
					</div>
				</div>
				<dl className="mt-4 grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-6 border-t pt-3 text-sm">
					<div>
						<dt className="text-muted-foreground text-xs">
							{t("estimates.public.serviceOrder")}
						</dt>
						<dd className="whitespace-nowrap font-medium">
							{serviceOrder.code}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs">
							{t("estimates.public.openedAt")}
						</dt>
						<dd className="whitespace-nowrap font-medium">
							{format.date(serviceOrder.openedAt, {
								dateStyle: undefined,
								day: "numeric",
								month: "short",
							})}
						</dd>
					</div>
					<div className="min-w-0">
						<dt className="text-muted-foreground text-xs">
							{t("estimates.public.orderStatus")}
						</dt>
						<dd className="truncate font-medium">
							{t(serviceOrderStatusKeys[serviceOrder.status])}
						</dd>
					</div>
				</dl>
				<div className="mt-4">
					<p className="text-muted-foreground text-xs">
						{t("estimates.public.reportedDefect")}
					</p>
					<blockquote className="mt-1 whitespace-pre-line text-pretty border-l-2 pl-3 text-sm">
						{device.reportedDefect}
					</blockquote>
				</div>
			</div>
		</Section>
	);
}

/** The lines with the parts of a service under it, and the totals. */
export function ItemsSection({
	estimate,
	title,
}: {
	estimate: Pick<PublicEstimate, "items" | "totals" | "discountPercentage">;
	title?: string;
}) {
	const { t, format } = useTranslation();

	return (
		<Section title={title ?? t("estimates.public.whatWillBeDone")}>
			<div className="overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_oklch(0_0_0/0.06),0_1px_2px_oklch(0_0_0/0.04)] dark:shadow-[0_0_0_1px_oklch(1_0_0/0.08)]">
				<ul className="divide-y">
					{estimate.items.map((item, index) => (
						<li
							className={cn(
								"flex items-start gap-3 px-4 py-3",
								item.nested && "border-t-0 bg-muted/20 py-2 pl-8"
							)}
							// Items have no id on the public view; the order is stable.
							key={`${item.name}-${index}`}
						>
							<div className="min-w-0 flex-1">
								<p
									className={cn(
										"text-sm",
										item.nested ? "text-muted-foreground" : "font-medium"
									)}
								>
									{item.name}
								</p>
								<p className="text-muted-foreground text-xs tabular-nums">
									{item.nested
										? t("estimates.public.servicePart")
										: t(`estimates.pdf.${item.type}`)}
									{item.quantity > 1 &&
										` · ${item.quantity} × ${format.currency(item.unitPrice)}`}
								</p>
							</div>
							<span
								className={cn(
									"shrink-0 text-sm tabular-nums",
									!item.nested && "font-medium"
								)}
							>
								{format.currency(item.total)}
							</span>
						</li>
					))}
				</ul>
				<dl className="space-y-1 border-t bg-muted/20 px-4 py-3 text-sm">
					<div className="flex justify-between text-muted-foreground">
						<dt>{t("estimates.pdf.subtotal")}</dt>
						<dd className="tabular-nums">
							{format.currency(estimate.totals.subtotal)}
						</dd>
					</div>
					{estimate.totals.discount > 0 && (
						<div className="flex justify-between text-emerald-700 dark:text-emerald-300">
							<dt>
								{t("estimates.pdf.discount", {
									percentage: format.number(estimate.discountPercentage),
								})}
							</dt>
							<dd className="tabular-nums">
								−{format.currency(estimate.totals.discount)}
							</dd>
						</div>
					)}
					<div className="flex justify-between pt-1 font-semibold text-base">
						<dt>{t("estimates.pdf.total")}</dt>
						<dd className="tabular-nums">
							{format.currency(estimate.totals.total)}
						</dd>
					</div>
				</dl>
			</div>
		</Section>
	);
}

function PdfSection({
	url,
	number,
	collapsible = false,
}: {
	url: string;
	number: string;
	collapsible?: boolean;
}) {
	const { t } = useTranslation();
	const [shown, setShown] = useState(!collapsible);
	const [loaded, setLoaded] = useState(false);

	return (
		<section className="flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_oklch(0_0_0/0.06),0_1px_2px_oklch(0_0_0/0.04)] dark:shadow-[0_0_0_1px_oklch(1_0_0/0.08)]">
			<div className="flex items-center gap-2 px-4 py-3">
				<FileText className="size-4 text-muted-foreground" />
				<span className="flex-1 font-medium text-sm">
					{t("estimates.public.pdf")}
				</span>
				<Button asChild size="sm" variant="ghost">
					<a href={url} rel="noopener" target="_blank">
						<ExternalLink className="size-3.5" />
						{t("estimates.public.openPdf")}
					</a>
				</Button>
			</div>
			{collapsible && (
				<button
					aria-expanded={shown}
					className="flex items-center justify-center gap-1.5 border-t py-2.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
					onClick={() => setShown((value) => !value)}
					type="button"
				>
					{shown
						? t("estimates.public.hidePdf")
						: t("estimates.public.showPdf")}
					<ChevronDown
						className={cn("size-4 transition-transform", shown && "rotate-180")}
					/>
				</button>
			)}
			{shown && (
				<div
					className={cn(
						"relative grid flex-1 border-t",
						collapsible && "h-[70dvh] flex-none"
					)}
				>
					{!loaded && (
						<FixrLoader className="absolute inset-0 m-auto" size={28} />
					)}
					{/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: onLoad only hides the loader */}
					<iframe
						className={cn(
							"size-full bg-white transition-opacity duration-300 ease-out",
							loaded ? "opacity-100" : "opacity-0"
						)}
						onLoad={() => setLoaded(true)}
						src={`${url}#view=FitH`}
						title={t("estimates.public.pdfTitle", { number })}
					/>
				</div>
			)}
		</section>
	);
}

/** Call, email or visit the shop: whichever contact it has. */
export function ContactSection({
	company,
}: {
	company: Pick<PublicEstimate["company"], "phone" | "email" | "website">;
}) {
	const { t } = useTranslation();
	const links = [
		company.phone && {
			href: `tel:${company.phone.replace(/[^\d+]/g, "")}`,
			label: t("estimates.public.call"),
			Icon: Phone,
		},
		company.email && {
			href: `mailto:${company.email}`,
			label: t("estimates.public.email"),
			Icon: Mail,
		},
		company.website && {
			href: company.website.startsWith("http")
				? company.website
				: `https://${company.website}`,
			label: t("estimates.public.website"),
			Icon: Globe,
		},
	].filter(Boolean) as { href: string; label: string; Icon: typeof Phone }[];

	if (links.length === 0) {
		return null;
	}

	return (
		<Section title={t("estimates.public.contact")}>
			<div className="flex flex-wrap gap-2">
				{links.map(({ href, label, Icon }) => (
					<Button asChild className="rounded-full" key={href} variant="outline">
						<a href={href} rel="noopener" target="_blank">
							<Icon className="size-4" />
							{label}
						</a>
					</Button>
				))}
			</div>
		</Section>
	);
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
