"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import { useQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { z } from "zod";
import {
	buildColumns,
	type dataSchema,
} from "@/components/dashboard/employees/columns";
import { DataTable } from "@/components/dashboard/employees/data-table";
import { Heading } from "@/components/dashboard/heading";
import { Reveal } from "@/components/skeleton";
import { axios } from "@/lib/auth/axios";
import { SAMPLE_EMPLOYEES } from "@/lib/samples";

export default function EmployeesPage() {
	const { t, format } = useTranslation();
	const params = useParams<{ subdomain: string }>();
	const columns = useMemo(() => buildColumns({ t, format }), [t, format]);

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
				description={t("employees.page.description")}
				title={t("employees.page.title")}
			/>
			<Reveal id="employees-table" loading={isPending}>
				<DataTable
					columns={columns}
					data={isPending ? SAMPLE_EMPLOYEES : records}
				/>
			</Reveal>
		</div>
	);
}
