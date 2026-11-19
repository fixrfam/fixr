"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useService } from "@/components/dashboard/parts/store";
import { NewServiceForm } from "@/components/dashboard/services/forms/new-service-form";
import { Reveal } from "@/components/skeleton";
import { FormShape } from "@/components/skeleton/shapes";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function EditServiceModal() {
	const router = useRouter();
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { data: service, isPending } = useService(id);

	let body = (
		<p className="text-muted-foreground text-sm">
			{t("services.page.notFound")}
		</p>
	);
	if (isPending || service) {
		body = (
			<Reveal id="service-form" loading={isPending}>
				{service ? (
					<NewServiceForm onSuccess={() => router.back()} service={service} />
				) : (
					<FormShape fields={6} />
				)}
			</Reveal>
		);
	}

	return (
		<ResponsiveDialogDrawer
			description={t("services.page.editDescription")}
			icon={<Wrench />}
			title={t("services.page.editTitle")}
		>
			{body}
		</ResponsiveDialogDrawer>
	);
}
