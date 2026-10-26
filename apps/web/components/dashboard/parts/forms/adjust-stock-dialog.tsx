"use client";

import { useTranslation } from "@fixr/i18n/react";
import { adjustPartStockSchema } from "@fixr/schemas/parts";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import {
	ArrowRight,
	Loader2,
	Minus,
	PackageMinus,
	PackagePlus,
	Plus,
	Save,
	TriangleAlert,
} from "lucide-react";
import {
	AnimatePresence,
	MotionConfig,
	motion,
	type Transition,
	useAnimate,
} from "motion/react";
import { type ComponentProps, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import type { PartRow } from "@/lib/services/inventory";
import { cn } from "@/lib/utils";
import { useAdjustPartStock } from "../store";
import { STOCK_STATUS_STYLES } from "../table/cells";
import { getStockStatus, STOCK_STATUS_KEYS } from "../table/data";
import { useApiErrorToast } from "./api-feedback";

type AdjustStockValues = z.infer<typeof adjustPartStockSchema>;
type AdjustablePart = Pick<PartRow, "id" | "name" | "stock" | "minStock">;

const QUICK_STEPS = [-10, -5, 5, 10] as const;
/** Keeps the typed amount within what the API can reasonably receive. */
const DELTA_PATTERN = /^[+-]?\d{0,6}$/;
const HAS_DIGIT = /\d/;

const spring: Transition = { type: "spring", stiffness: 420, damping: 32 };

function formatDelta(delta: number) {
	return delta > 0 ? `+${delta}` : String(delta);
}

function parseDelta(text: string) {
	return HAS_DIGIT.test(text) ? Number(text) : null;
}

function StepButton({
	className,
	...props
}: ComponentProps<typeof motion.button>) {
	return (
		<motion.button
			className={cn(
				"inline-flex size-12 shrink-0 items-center justify-center rounded-full border bg-background shadow-xs transition-colors",
				"hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				"disabled:pointer-events-none disabled:opacity-40",
				className
			)}
			type="button"
			whileHover={{ scale: 1.06 }}
			whileTap={{ scale: 0.88 }}
			{...props}
		/>
	);
}

/** Where the stock stands now and where it lands after the adjustment. */
function StockPreview({
	part,
	next,
	delta,
}: {
	part: AdjustablePart;
	next: number;
	delta: number;
}) {
	const { t } = useTranslation();
	const status = getStockStatus({
		stock: Math.max(next, 0),
		minStock: part.minStock,
	});
	// A scale that only grows keeps the bar from jumping around while stepping.
	const scale = Math.max(part.stock * 2, part.minStock * 2, next, 10);
	const percent = (value: number) =>
		`${Math.min(Math.max(value, 0) / scale, 1) * 100}%`;
	const trend = Math.sign(delta);

	return (
		<div
			aria-live="polite"
			className="space-y-4 rounded-xl border bg-muted/30 p-4"
		>
			<div className="flex items-end justify-between gap-4">
				<div>
					<p className="text-muted-foreground text-xs">
						{t("parts.stockAdjustment.current")}
					</p>
					{/* Same box as the counter on the right, so both numbers line up. */}
					<AnimatedCounter
						className="font-semibold text-2xl"
						value={part.stock}
					/>
				</div>
				<motion.span
					animate={{ x: trend * 4, opacity: trend === 0 ? 0.3 : 1 }}
					className={cn(
						"mb-1.5 text-muted-foreground",
						trend > 0 && "text-emerald-600 dark:text-emerald-400",
						trend < 0 && "text-red-600 dark:text-red-400"
					)}
					transition={spring}
				>
					<ArrowRight className="size-5" />
				</motion.span>
				<div className="text-right">
					<p className="text-muted-foreground text-xs">
						{t("parts.stockAdjustment.next")}
					</p>
					<AnimatedCounter
						className={cn(
							"font-semibold text-2xl tabular-nums",
							next < 0 && "text-red-600 dark:text-red-400"
						)}
						value={next}
					/>
				</div>
			</div>

			<div className="relative h-2.5 rounded-full bg-muted">
				<motion.div
					animate={{ width: percent(next) }}
					className={cn(
						"absolute inset-y-0 left-0 rounded-full",
						status === "in_stock" && "bg-emerald-500",
						status === "low_stock" && "bg-amber-500",
						status === "out_of_stock" && "bg-red-500"
					)}
					initial={false}
					transition={spring}
				/>
				{/* Where the stock is today, so the change reads at a glance. */}
				<span
					className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground/50"
					style={{ left: percent(part.stock) }}
				/>
				{part.minStock > 0 && (
					<span
						className="absolute -inset-y-1 w-px border-amber-500 border-l border-dashed"
						style={{ left: percent(part.minStock) }}
					/>
				)}
			</div>

			<div className="flex items-center justify-between gap-2 text-xs">
				<AnimatePresence initial={false} mode="popLayout">
					<motion.span
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						initial={{ opacity: 0, scale: 0.8 }}
						key={status}
						transition={spring}
					>
						<Badge
							className={cn("rounded-md", STOCK_STATUS_STYLES[status])}
							variant="outline"
						>
							{t(STOCK_STATUS_KEYS[status])}
						</Badge>
					</motion.span>
				</AnimatePresence>
				<span className="text-muted-foreground">
					{t("parts.stockAdjustment.minStockMarker", { count: part.minStock })}
				</span>
			</div>

			{delta !== 0 && (
				<p className="sr-only">
					{t("parts.stockAdjustment.preview", {
						current: part.stock,
						next,
					})}
				</p>
			)}
		</div>
	);
}

function SubmitIcon({ delta, pending }: { delta: number; pending: boolean }) {
	if (pending) {
		return <Loader2 className="animate-spin" />;
	}
	if (delta > 0) {
		return <PackagePlus />;
	}
	if (delta < 0) {
		return <PackageMinus />;
	}
	return <Save />;
}

function AdjustStockForm({
	part,
	onDone,
}: {
	part: AdjustablePart;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const adjustStock = useAdjustPartStock();
	const toastError = useApiErrorToast();
	const [text, setText] = useState("");
	const [scope, animate] = useAnimate();

	const form = useForm<AdjustStockValues>({
		resolver: zodResolver(adjustPartStockSchema),
		mode: "onSubmit",
	});

	const delta = parseDelta(text) ?? 0;
	const next = part.stock + delta;
	const insufficient = next < 0;
	const canSubmit = delta !== 0 && !insufficient && !adjustStock.isPending;

	function setDelta(value: number) {
		setText(value === 0 ? "" : formatDelta(value));
		form.setValue("delta", value);
		form.clearErrors("delta");
	}

	function step(amount: number) {
		setDelta(delta + amount);
		// A small bump tells the user the button did something.
		animate(scope.current, { scale: [1, 1.12, 1] }, { duration: 0.25 });
	}

	async function onSubmit(values: AdjustStockValues) {
		try {
			await adjustStock.mutateAsync({ id: part.id, delta: values.delta });
			toast.success({ text: t("parts.stockAdjustment.success") });
			onDone();
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<Form {...form}>
			<form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="delta"
					render={({ field }) => (
						<FormItem className="justify-items-center gap-4">
							<div className="flex items-center justify-center gap-4">
								<StepButton
									aria-label={t("parts.stockAdjustment.decrease")}
									disabled={next <= 0}
									onClick={() => step(-1)}
								>
									<Minus className="size-5" />
								</StepButton>
								<div className="flex flex-col items-center gap-1" ref={scope}>
									<div
										className={cn(
											"relative grid w-40 place-items-center font-semibold text-5xl tracking-tight transition-colors",
											delta > 0 && "text-emerald-600 dark:text-emerald-400",
											delta < 0 && "text-red-600 dark:text-red-400",
											text === "" && "text-muted-foreground/40"
										)}
									>
										{/* The counter draws the number; the input on top only takes the typing. */}
										<AnimatedCounter
											prefix={text === "-" || text === "+" ? text : undefined}
											signDisplay="exceptZero"
											value={delta}
										/>
										<FormControl>
											<input
												autoComplete="off"
												autoFocus
												className="absolute inset-0 w-full bg-transparent text-center text-transparent caret-foreground outline-none selection:bg-primary/20 placeholder:text-transparent"
												inputMode="numeric"
												name={field.name}
												onBlur={field.onBlur}
												onChange={(e) => {
													const value = e.target.value.trim();
													if (!DELTA_PATTERN.test(value)) {
														return;
													}
													setText(value);
													field.onChange(parseDelta(value));
												}}
												onKeyDown={(e) => {
													if (e.key === "ArrowUp" || e.key === "ArrowDown") {
														e.preventDefault();
														const size = e.shiftKey ? 10 : 1;
														step(e.key === "ArrowUp" ? size : -size);
													}
												}}
												placeholder="0"
												ref={field.ref}
												value={text}
											/>
										</FormControl>
									</div>
									<FormLabel className="text-muted-foreground text-xs">
										{t("parts.stockAdjustment.deltaLabel")}
									</FormLabel>
								</div>
								<StepButton
									aria-label={t("parts.stockAdjustment.increase")}
									onClick={() => step(1)}
								>
									<Plus className="size-5" />
								</StepButton>
							</div>

							<div className="flex flex-wrap justify-center gap-2">
								{QUICK_STEPS.map((amount) => (
									<motion.div key={amount} whileTap={{ scale: 0.92 }}>
										<Button
											aria-label={t(
												amount > 0
													? "parts.stockAdjustment.quickAdd"
													: "parts.stockAdjustment.quickRemove",
												{ count: Math.abs(amount) }
											)}
											className="h-7 rounded-full px-3 font-mono text-xs tabular-nums"
											disabled={next + amount < 0}
											onClick={() => step(amount)}
											size="sm"
											type="button"
											variant="outline"
										>
											{formatDelta(amount)}
										</Button>
									</motion.div>
								))}
							</div>

							<FormDescription className="text-center">
								{t("parts.stockAdjustment.deltaDescription")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<StockPreview delta={delta} next={next} part={part} />

				<AnimatePresence initial={false}>
					{insufficient && (
						<motion.p
							animate={{ opacity: 1, height: "auto" }}
							className="flex items-center gap-2 overflow-hidden text-red-600 text-sm dark:text-red-400"
							exit={{ opacity: 0, height: 0 }}
							initial={{ opacity: 0, height: 0 }}
							role="alert"
							transition={spring}
						>
							<TriangleAlert className="size-4 shrink-0" />
							{t("parts.stockAdjustment.insufficient", { count: part.stock })}
						</motion.p>
					)}
				</AnimatePresence>

				<Button className="w-full" disabled={!canSubmit} type="submit">
					{delta === 0 || insufficient
						? t("parts.stockAdjustment.submit")
						: t(
								delta > 0
									? "parts.stockAdjustment.submitAdd"
									: "parts.stockAdjustment.submitRemove",
								{ count: Math.abs(delta) }
							)}{" "}
					<SubmitIcon delta={delta} pending={adjustStock.isPending} />
				</Button>
			</form>
		</Form>
	);
}

/** Adds or removes units of a part. Stock never changes through the part form. */
export function AdjustStockDialog({ part }: { part: AdjustablePart }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	return (
		<ResponsiveDialogDrawer
			description={t("parts.stockAdjustment.description", { name: part.name })}
			icon={<PackagePlus />}
			onOpenChange={setOpen}
			open={open}
			title={t("parts.stockAdjustment.title")}
			trigger={
				<Button
					aria-label={t("parts.stockAdjustment.triggerLabel", {
						name: part.name,
					})}
					onClick={(e) => e.stopPropagation()}
					size="sm"
					type="button"
					variant="outline"
				>
					<PackagePlus className="size-3.5" />{" "}
					{t("parts.stockAdjustment.trigger")}
				</Button>
			}
		>
			{open && (
				<MotionConfig reducedMotion="user">
					<AdjustStockForm onDone={() => setOpen(false)} part={part} />
				</MotionConfig>
			)}
		</ResponsiveDialogDrawer>
	);
}
