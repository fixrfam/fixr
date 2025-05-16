import { Heading } from "@/components/dashboard/heading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function EmployeesPage() {
    return (
        <div className='flex flex-col gap-6'>
            <Heading
                title={"Funcionários"}
                description={"Veja ou gerencie os funcionários da sua empresa"}
            />
            <Link href={"/dashboard/employees/new"} prefetch>
                <Button>
                    Cadastrar funcionários
                    <Plus />
                </Button>
            </Link>
        </div>
    );
}
