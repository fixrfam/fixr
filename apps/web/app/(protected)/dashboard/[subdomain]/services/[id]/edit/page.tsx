"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { useService } from "@/components/dashboard/parts/store";
import { NewServiceForm } from "@/components/dashboard/services/forms/new-service-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditServicePage() {
	const router = useRouter();
	const { t } = useTranslation();
	const params = useParams<{ subdomain: string; id: string }>();
	const { data: service, isPending } = useService(params.id);

	if (isPending) {
		return <Skeleton className="h-96 w-full max-w-2xl" />;
	}

	if (!service) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description={t("services.page.editDescription")}
				Icon={Wrench}
				title={t("services.page.editTitle")}
			/>
			<div>
				<NewServiceForm
					className="max-w-2xl"
					onSuccess={() =>
						router.push(`/dashboard/${params.subdomain}/services`)
					}
					service={service}
				/>
			</div>
		</div>
	);
}
