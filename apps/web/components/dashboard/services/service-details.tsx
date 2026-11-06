import { useTranslation } from "@fixr/i18n/react";
import type { ReactNode } from "react";
import {
	DurationCell,
	PriceCell,
	SkuCell,
} from "@/components/dashboard/parts/table/cells";
import type { ServiceTableRow } from "@/components/dashboard/parts/table/data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="space-y-2">
			<h3 className="font-semibold text-sm">{title}</h3>
			{children}
		</section>
	);
}

function TopicList({ topics, empty }: { topics: string[]; empty: string }) {
	if (topics.length === 0) {
		return <p className="text-muted-foreground text-sm">{empty}</p>;
	}

	return (
		<ul className="list-disc space-y-1 pl-5 text-sm marker:text-muted-foreground">
			{topics.map((topic) => (
				<li key={topic}>{topic}</li>
			))}
		</ul>
	);
}

export function ServiceDetails({
	service,
	className,
}: {
	service: ServiceTableRow;
	className?: string;
}) {
	const { t } = useTranslation();

	return (
		<div className={cn("space-y-6", className)}>
			<p className="text-sm">{service.description}</p>

			<div className="grid grid-cols-2 gap-4 rounded-md border p-4 text-sm">
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						{t("services.details.duration")}
					</span>
					<span className="font-medium">
						<DurationCell minutes={service.estimatedDurationMinutes} />
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						{t("services.details.price")}
					</span>
					<span className="font-medium">
						<PriceCell value={service.totalPrice} />
					</span>
				</div>
				{service.partsPrice > 0 && (
					<>
						<div className="flex flex-col gap-1">
							<span className="text-muted-foreground text-xs">
								{t("services.details.laborPrice")}
							</span>
							<PriceCell value={service.price} />
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-muted-foreground text-xs">
								{t("services.details.partsPrice")}
							</span>
							<PriceCell value={service.partsPrice} />
						</div>
					</>
				)}
			</div>

			<Section title={t("services.details.deviceCategories")}>
				<div className="flex flex-wrap gap-1">
					{service.deviceCategories.map((category) => (
						<Badge className="rounded-md" key={category} variant="secondary">
							{category}
						</Badge>
					))}
				</div>
			</Section>

			<Section title={t("services.details.testInstructions")}>
				<TopicList
					empty={t("services.details.noTestInstructions")}
					topics={service.testInstructions}
				/>
			</Section>

			<Section title={t("services.details.testParameters")}>
				<TopicList
					empty={t("services.details.noTestParameters")}
					topics={service.testParameters}
				/>
			</Section>

			<Section title={t("services.details.parts")}>
				{service.parts.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						{t("services.details.noParts")}
					</p>
				) : (
					<ul className="divide-y rounded-md border text-sm">
						{service.parts.map((part) => (
							<li
								className="flex items-center justify-between gap-3 px-3 py-2"
								key={part.id}
							>
								<span className="font-medium">{part.name}</span>
								<SkuCell sku={part.sku} />
							</li>
						))}
					</ul>
				)}
			</Section>
		</div>
	);
}
