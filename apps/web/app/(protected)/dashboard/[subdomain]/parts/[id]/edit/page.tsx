"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Puzzle } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";
import { usePartsStore } from "@/components/dashboard/parts/store";

export default function EditPartPage() {
	const router = useRouter();
	const { t } = useTranslation();
	const params = useParams<{ subdomain: string; id: string }>();
	const part = usePartsStore((state) =>
		state.parts.find((item) => item.id === params.id)
	);

	if (!part) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description={t("parts.page.editDescription")}
				Icon={Puzzle}
				title={t("parts.page.editTitle")}
			/>
			<div>
				<NewPartForm
					className="max-w-2xl"
					onSuccess={() => router.push(`/dashboard/${params.subdomain}/parts`)}
					part={part}
				/>
			</div>
		</div>
	);
}
