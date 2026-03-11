"use client";

import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import { useQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { useParams } from "next/navigation";
import type { z } from "zod";
import {
	columns,
	type dataSchema,
} from "@/components/dashboard/employees/columns";
import { DataTable } from "@/components/dashboard/employees/data-table";
import { Heading } from "@/components/dashboard/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { axios } from "@/lib/auth/axios";

export default function EmployeesPage() {
	const params = useParams<{ subdomain: string }>();

	const { isPending, data } = useQuery<
		AxiosResponse<ApiResponse<PaginatedData<z.infer<typeof dataSchema>>>>
	>({
		queryKey: ["employeesData"],
		queryFn: async () =>
			await axios.get(`/companies/${params.subdomain}/employees?page=1`),
	});

	const records = data?.data.data?.records ?? [];

	return (
		<div className="flex flex-col gap-2">
			<Heading
				description={"Veja ou gerencie os funcionários da sua empresa"}
				title={"Funcionários"}
			/>
			{isPending ? (
				<div className="mt-4 space-y-2">
					<div className="flex w-full justify-between">
						<div className="flex">
							<Skeleton className="h-10 w-64" />
						</div>
						<div className="flex gap-2">
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-32" />
						</div>
					</div>
					<Skeleton className="h-96 w-full rounded-md" />
				</div>
			) : (
				<DataTable columns={columns} data={records} />
			)}
		</div>
	);
}
