"use client";

import { BackButton } from "@/components/dashboard/back-button";
import { CreateEmployeeForm } from "@/components/dashboard/employees/new/CreateEmployeeForm";
import { Heading } from "@/components/dashboard/heading";
import { getClientSession } from "@/lib/auth/utils";
import { UserRoundPlus } from "lucide-react";
import { redirect, useRouter } from "next/navigation";

export default function NewEmployeePage() {
    const session = getClientSession();

    const router = useRouter();

    if (!session) {
        return redirect("/auth/login");
    }

    return (
        <div className='flex flex-col gap-6'>
            <div className='space-y-2'>
                <BackButton variant={"link"} />
                <Heading
                    Icon={UserRoundPlus}
                    title={"Cadastrar funcionários"}
                    description={"Adicione um ou mais os funcionários na sua empresa."}
                />
            </div>
            <CreateEmployeeForm
                session={session}
                onSuccess={() => router.push("/dashboard/employees")}
            />
        </div>
    );
}
