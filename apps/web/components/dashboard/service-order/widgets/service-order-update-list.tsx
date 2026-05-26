import type { ServiceOrderRow } from "@fixr/mock";

/**
 * Timeline update list aligned with the status dot.
 */
function ServiceOrderUpdateList({
	entries,
}: {
	entries: ServiceOrderRow["history"];
}) {
	if (!entries || entries.length === 0) {
		return null;
	}

	return (
		<div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
			<div className="relative space-y-3">
				{entries.map((entry, entryIndex) => (
					<div className="relative pl-6" key={entry.id}>
						<span className="absolute top-2 left-0 block size-2 rounded-full border border-border bg-muted-foreground/40" />
						{entryIndex < entries.length - 1 && (
							<span className="absolute top-4 left-[3px] h-[calc(100%+0.5rem)] w-px bg-border/70" />
						)}
						<span className="block text-muted-foreground text-xs">
							{entry.dateTime}
						</span>
						<p className="text-foreground text-sm">{entry.comment}</p>
					</div>
				))}
			</div>
		</div>
	);
}

export { ServiceOrderUpdateList };
