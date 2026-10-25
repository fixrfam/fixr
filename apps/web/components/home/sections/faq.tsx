"use client";

import { useTranslation } from "@fixr/i18n/react";
import { MessageCircleQuestion } from "lucide-react";
import { Faq as FaqThread } from "@/components/ui/faq";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";

const QUESTIONS = [
	"install",
	"approval",
	"tracking",
	"roles",
	"stock",
	"catalog",
	"invoices",
	"pricing",
	"language",
	"integrations",
] as const;

export default function Faq() {
	const { t } = useTranslation();

	const items = QUESTIONS.map((key) => ({
		id: key,
		question: t(`home.faq.items.${key}.question`),
		answer: t(`home.faq.items.${key}.answer`),
	}));

	return (
		<section
			className="flex w-full max-w-3xl scroll-mt-24 flex-col items-center gap-12"
			id="faq"
		>
			<SectionHeading
				badge={t("home.faq.badge")}
				icon={MessageCircleQuestion}
				titleBefore={t("home.faq.titleBefore")}
				titleHighlight={t("home.faq.titleHighlight")}
			/>
			<Reveal className="flex w-full justify-center">
				<FaqThread className="max-w-2xl" defaultValue="install" items={items} />
			</Reveal>
		</section>
	);
}
