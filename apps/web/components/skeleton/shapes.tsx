"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Rough shapes for content that can't be rendered from a sample (it loads
 * more on its own). Inside a `Reveal` with an `id` they only show on the
 * first visit: from then on skullet draws the shape the real content had.
 */

const widths = ["w-11/12", "w-3/4", "w-5/6", "w-2/3", "w-4/5"];

/** `[0, 1, …, count - 1]`, as stable keys for placeholder lists. */
const range = (count: number) => [...new Array(count).keys()];

/** A titled card with a few lines of text. */
export function CardShape({
	className,
	lines = 3,
}: {
	className?: string;
	lines?: number;
}) {
	return (
		<div className={cn("space-y-4 rounded-lg border bg-card p-5", className)}>
			<div className="flex items-center gap-2.5">
				<Skeleton className="size-8 rounded-lg" />
				<Skeleton className="h-4 w-32" />
			</div>
			<div className="space-y-2.5">
				{range(lines).map((line) => (
					<Skeleton
						className={cn("h-3.5", widths[line % widths.length])}
						key={line}
					/>
				))}
			</div>
		</div>
	);
}

/** A grid of cards, like a details page. */
export function CardsShape({
	cards = 4,
	className,
}: {
	cards?: number;
	className?: string;
}) {
	return (
		<div className={cn("grid gap-4 lg:grid-cols-2", className)}>
			{range(cards).map((card) => (
				<CardShape key={card} lines={card % 2 ? 4 : 3} />
			))}
		</div>
	);
}

/** Rows of an avatar or icon next to two lines. */
export function ListShape({
	className,
	rows = 3,
}: {
	className?: string;
	rows?: number;
}) {
	return (
		<div className={cn("divide-y rounded-lg border", className)}>
			{range(rows).map((row) => (
				<div className="flex items-center gap-3 p-3" key={row}>
					<Skeleton className="size-9 shrink-0 rounded-lg" />
					<div className="flex-1 space-y-2">
						<Skeleton className={cn("h-3.5", row % 2 ? "w-40" : "w-52")} />
						<Skeleton className="h-3 w-24" />
					</div>
					<Skeleton className="h-6 w-16 rounded-full" />
				</div>
			))}
		</div>
	);
}

/** Labelled fields and a submit button. */
export function FormShape({
	className,
	fields = 4,
}: {
	className?: string;
	fields?: number;
}) {
	return (
		<div className={cn("space-y-5", className)}>
			{range(fields).map((field) => (
				<div className="space-y-2" key={field}>
					<Skeleton className="h-3.5 w-24" />
					<Skeleton className="h-9 w-full" />
				</div>
			))}
			<Skeleton className="ml-auto h-9 w-32" />
		</div>
	);
}

/** A details page: its title and actions over a grid of cards. */
export function PageShape({
	cards = 4,
	className,
}: {
	cards?: number;
	className?: string;
}) {
	return (
		<div className={cn("space-y-6", className)}>
			<Skeleton className="h-8 w-20" />
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2.5">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-80 max-w-full" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-28" />
				</div>
			</div>
			<CardsShape cards={cards} />
		</div>
	);
}
