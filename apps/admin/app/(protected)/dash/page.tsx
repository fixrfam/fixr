import { DashHeader } from "@/components/dash/header";
import { Button } from "@/components/ui/button";
import { List, Plus } from "lucide-react";
import Link from "next/link";

export default function Page() {
    return (
        <div className='space-y-4'>
            <DashHeader title='Fixr - Admin' description='Painel de administrador' />
            <div className='flex gap-2'>
                <Button asChild variant={"outline"}>
                    <Link href='/dash/organizations/new'>
                        <Plus />
                        Criar nova organização
                    </Link>
                </Button>
                <Button asChild variant={"outline"}>
                    <Link href='/dash/organizations'>
                        <List />
                        Ver organizações
                    </Link>
                </Button>
            </div>
        </div>
    );
}
