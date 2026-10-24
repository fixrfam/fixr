"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
	CompanyProfileForm,
	CompanyProfileFormSkeleton,
} from "@/components/dashboard/company/company-profile-form";
import { Heading } from "@/components/dashboard/heading";
import { companyQueryKey, getCompany } from "@/lib/services/company";

export default function CompanySettingsPage() {
	const { t } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();

	const { data: company, isPending } = useQuery({
		queryKey: companyQueryKey(subdomain),
		queryFn: () => getCompany(subdomain),
	});

	return (
		<div className="flex flex-col gap-8">
			<Heading
				description={t("company.page.description")}
				title={t("company.page.title")}
			/>
			{isPending || !company ? (
				<CompanyProfileFormSkeleton />
			) : (
				<CompanyProfileForm company={company} />
			)}
		</div>
	);
}
