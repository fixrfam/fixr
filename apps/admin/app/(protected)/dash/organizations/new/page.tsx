import { CreateOrg } from "@/components/dash/forms/CreateOrg";
import { DashHeader } from "@/components/dash/header";

export default function NewOrgPage() {
    return (
        <>
            <DashHeader
                title='Criar uma nova organização'
                description=' Aqui você pode criar uma nova organização e definir um admin padrão.'
            />
            <CreateOrg />
        </>
    );
}
