/**
 * List of parts required for a service order.
 */
function ServiceOrderPartsList({ parts }: { parts?: string[] }) {
	if (!parts || parts.length === 0) {
		return (
			<p className="text-2xs text-muted-foreground">Nenhuma peça registrada.</p>
		);
	}

	return (
		<div className="grid gap-2">
			{parts.map((part) => (
				<div
					className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-2xs"
					key={part}
				>
					<span className="wrap-break-words font-medium">{part}</span>
					<span className="text-muted-foreground">1x</span>
				</div>
			))}
		</div>
	);
}

export { ServiceOrderPartsList };
