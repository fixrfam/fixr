"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useParams } from "next/navigation";
import {
	CompanyProfileForm,
	CompanyProfileFormSkeleton,
} from "@/components/dashboard/company/company-profile-form";
import { Heading } from "@/components/dashboard/heading";
import { useCompany } from "@/lib/hooks/use-company";

export default function CompanySettingsPage() {
	const { t } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();

	const { data: company, isPending } = useCompany(subdomain);

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
