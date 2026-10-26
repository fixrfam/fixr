"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ScrollProgress } from "@/components/ui/scroll-progress";

/** Floating pill that tracks reading progress and jumps between landing sections. */
export function PageProgress() {
	const { t } = useTranslation();

	const sections = [
		{ id: "overview", label: t("home.nav.overview") },
		{ id: "why", label: t("home.problem.badge") },
		{ id: "features", label: t("home.nav.features") },
		{ id: "how-it-works", label: t("home.nav.howItWorks") },
		{ id: "roles", label: t("home.nav.roles") },
		{ id: "proof", label: t("home.proof.badge") },
		{ id: "faq", label: t("home.nav.faq") },
	];

	// Sits above the API downtime banner, which is pinned to the bottom center.
	return (
		<ScrollProgress
			className="bottom-14"
			menuLabel={t("home.nav.showSections")}
			sections={sections}
		/>
	);
}
