"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Puzzle } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";
import { usePart } from "@/components/dashboard/parts/store";
import { Reveal } from "@/components/skeleton";
import { FormShape } from "@/components/skeleton/shapes";

export default function EditPartPage() {
	const router = useRouter();
	const { t } = useTranslation();
	const params = useParams<{ subdomain: string; id: string }>();
	const { data: part, isPending } = usePart(params.id);

	if (!(isPending || part)) {
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
			<Reveal id="part-form" loading={isPending}>
				{part ? (
					<NewPartForm
						className="max-w-2xl"
						onSuccess={() =>
							router.push(`/dashboard/${params.subdomain}/parts`)
						}
						part={part}
					/>
				) : (
					<FormShape className="max-w-2xl" fields={6} />
				)}
			</Reveal>
		</div>
	);
}
