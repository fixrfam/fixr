"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Avatar } from "@/components/account/profile-avatar";
import { useCompany } from "@/lib/hooks/use-company";

/**
 * The company's logo (square, as cropped in the settings) or, without one,
 * the generated square avatar. Shares the settings page query, so a saved logo
 * shows up here right away.
 */
export function CompanyMark({
	companyId,
	subdomain,
}: {
	companyId: string;
	subdomain: string;
}) {
	const { t } = useTranslation();
	const { data: company } = useCompany(subdomain);

	if (company?.logoUrl) {
		return (
			<div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-muted/30">
				<img
					alt={t("company.logo.alt")}
					className="size-full object-contain"
					height={36}
					src={company.logoUrl}
					width={36}
				/>
			</div>
		);
	}

	return (
		<Avatar
			className="size-9 shrink-0 rounded-sm"
			fallbackHash={companyId}
			fallbackType="marble"
			variant="square"
		/>
	);
}
