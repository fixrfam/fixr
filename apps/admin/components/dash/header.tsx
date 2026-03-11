export function DashHeader({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col">
			<h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
			<p className="text-muted-foreground text-sm">{description}</p>
		</div>
	);
}
