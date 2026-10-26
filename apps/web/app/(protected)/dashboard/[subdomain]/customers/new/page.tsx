"use client";

import { useTranslation } from "@fixr/i18n/react";
import { UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { CustomerForm } from "@/components/dashboard/customers/customer-form";
import { Heading } from "@/components/dashboard/heading";

export default function NewCustomerPage() {
	const router = useRouter();
	const { t } = useTranslation();
	const params = useParams<{ subdomain: string }>();

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description={t("clients.page.newDescription")}
				Icon={UserPlus}
				title={t("clients.page.newTitle")}
			/>
			<CustomerForm
				className="max-w-2xl"
				cols={2}
				onSaved={(customer) =>
					router.push(`/dashboard/${params.subdomain}/customers/${customer.id}`)
				}
			/>
		</div>
	);
}
