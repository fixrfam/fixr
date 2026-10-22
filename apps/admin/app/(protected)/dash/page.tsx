import { List, Plus } from "lucide-react";
import Link from "next/link";
import { DashHeader } from "@/components/dash/header";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/server";

export default async function Page() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-4">
			<DashHeader
				description={t("admin.dashboard.description")}
				title={t("admin.dashboard.title")}
			/>
			<div className="flex gap-2">
				<Button asChild variant={"outline"}>
					<Link href="/dash/companies/new">
						<Plus />
						{t("admin.dashboard.newCompany")}
					</Link>
				</Button>
				<Button asChild variant={"outline"}>
					<Link href="/dash/companies">
						<List />
						{t("admin.dashboard.listCompanies")}
					</Link>
				</Button>
			</div>
		</div>
	);
}
