"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Avatar } from "@/components/account/profile-avatar";
import { useCompany } from "@/lib/hooks/use-company";

/**
 * The company's logo (16:9, as cropped in the settings) or, without one, the
 * generated square avatar. Shares the settings page query, so a saved logo
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
			<div className="flex aspect-video h-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-muted/30">
				<img
					alt={t("company.logo.alt")}
					className="size-full object-contain p-0.5"
					height={36}
					src={company.logoUrl}
					width={64}
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
