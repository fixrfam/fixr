"use client";

import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import { useQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { KeyRound } from "lucide-react";
import { useParams } from "next/navigation";
import type { ApiKeyRow } from "@/components/dashboard/api-keys/columns";
import { ApiKeysTable } from "@/components/dashboard/api-keys/data-table";
import { Heading } from "@/components/dashboard/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { axios } from "@/lib/auth/axios";

export default function ApiKeysPage() {
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
				description={
					"Chaves para acesso programático à API do Fixr. O segredo é exibido apenas na criação."
				}
				Icon={KeyRound}
				title={"Chaves de API"}
			/>
			{isPending ? (
				<div className="mt-4 space-y-2">
					<div className="flex w-full justify-between">
						<Skeleton className="h-10 w-64" />
						<Skeleton className="h-10 w-32" />
					</div>
					<Skeleton className="h-96 w-full rounded-md" />
				</div>
			) : (
				<ApiKeysTable data={records} />
			)}
		</div>
	);
}
