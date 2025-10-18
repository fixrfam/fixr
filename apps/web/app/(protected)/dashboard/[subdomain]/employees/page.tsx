"use client";

import { columns, dataSchema } from "@/components/dashboard/employees/columns";
import { DataTable } from "@/components/dashboard/employees/data-table";
import { Heading } from "@/components/dashboard/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { axios } from "@/lib/auth/axios";
import { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useParams } from "next/navigation";
import { z } from "zod";

export default function EmployeesPage() {
    const params = useParams<{ subdomain: string }>();

    const { isPending, data } = useQuery<
        AxiosResponse<ApiResponse<PaginatedData<z.infer<typeof dataSchema>>>>
    >({
        queryKey: ["employeesData"],
        queryFn: async () => await axios.get(`/companies/${params.subdomain}/employees?page=1`),
    });

    const records = data?.data.data?.records ?? [];

    return (
        <div className='flex flex-col gap-2'>
            <Heading
                title={"Funcionários"}
                description={"Veja ou gerencie os funcionários da sua empresa"}
            />
            {!isPending ? (
                <DataTable data={records} columns={columns} />
            ) : (
                <div className='mt-4 space-y-2'>
                    <div className='w-full flex justify-between'>
                        <div className='flex'>
                            <Skeleton className='w-64 h-10' />
                        </div>
                        <div className='flex gap-2'>
                            <Skeleton className='w-24 h-10' />
                            <Skeleton className='w-32 h-10' />
                        </div>
                    </div>
                    <Skeleton className='w-full h-96 rounded-md' />
                </div>
            )}
        </div>
    );
}
