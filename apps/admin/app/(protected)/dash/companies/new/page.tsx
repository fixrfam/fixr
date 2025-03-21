import { CreateCompany } from "@/components/dash/forms/CreateCompany";
import { DashHeader } from "@/components/dash/header";

export default function NewCompanyPage() {
    return (
        <>
            <DashHeader
                title='Criar uma nova empresa'
                description=' Aqui você pode criar uma nova empresa e definir um admin padrão.'
            />
            <CreateCompany />
        </>
    );
}
