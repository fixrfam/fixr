"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePartsStore } from "./store";
import { PartsTable } from "./table/parts-table";
import { ServicesTable } from "./table/services-table";

export function PartsTabs() {
	const partsCount = usePartsStore((state) => state.parts.length);
	const servicesCount = usePartsStore((state) => state.services.length);

	const tabs = [
		{ id: "parts", label: "Peças", count: partsCount },
		{ id: "services", label: "Serviços", count: servicesCount },
	];

	return (
		<Tabs className="gap-4" defaultValue="parts">
			<TabsList>
				{tabs.map((tab) => (
					<TabsTrigger className="px-3" key={tab.id} value={tab.id}>
						{tab.label}
						<Badge className="rounded-md px-1.5" variant="secondary">
							{tab.count}
						</Badge>
					</TabsTrigger>
				))}
			</TabsList>
			<TabsContent value="parts">
				<PartsTable />
			</TabsContent>
			<TabsContent value="services">
				<ServicesTable />
			</TabsContent>
		</Tabs>
	);
}
