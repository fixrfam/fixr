"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useParams } from "next/navigation";
import { CompanyProfileForm } from "@/components/dashboard/company/company-profile-form";
import { Heading } from "@/components/dashboard/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompany } from "@/lib/services/company";

export default function CompanySettingsPage() {
	const { t } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();

	const { data: company, isPending } = useQuery({
		queryKey: ["company", subdomain],
		queryFn: () => getCompany(subdomain),
	});

	return (
		<div className="flex flex-col gap-8">
			<Heading
				description={t("company.page.description")}
				Icon={Building2}
				title={t("company.page.title")}
			/>
			{isPending || !company ? (
				<div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
					<Skeleton className="aspect-video w-full rounded-md" />
					<div className="space-y-6">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</div>
			) : (
				<CompanyProfileForm company={company} />
			)}
		</div>
	);
}
