"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import { useQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { useParams } from "next/navigation";
import type { ApiKeyRow } from "@/components/dashboard/api-keys/columns";
import { ApiKeysTable } from "@/components/dashboard/api-keys/data-table";
import { Heading } from "@/components/dashboard/heading";
import { Reveal } from "@/components/skeleton";
import { axios } from "@/lib/auth/axios";
import { SAMPLE_API_KEYS } from "@/lib/samples";

export default function ApiKeysPage() {
	const { t } = useTranslation();
	const params = useParams<{ subdomain: string }>();

	const { isPending, data } = useQuery<
		AxiosResponse<ApiResponse<PaginatedData<ApiKeyRow>>>
	>({
		queryKey: ["apiKeysData"],
		queryFn: async () =>
			await axios.get(`/companies/${params.subdomain}/api-keys?page=1`),
	});

	const records = data?.data.data?.records ?? [];

	return (
		<div className="flex flex-col gap-2">
			<Heading
				description={t("apiKeys.page.description")}
				title={t("apiKeys.page.title")}
			/>
			<Reveal id="api-keys-table" loading={isPending}>
				<ApiKeysTable data={isPending ? SAMPLE_API_KEYS : records} />
			</Reveal>
		</div>
	);
}
