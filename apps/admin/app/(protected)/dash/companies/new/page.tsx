import { CreateCompany } from "@/components/dash/forms/create-company";
import { DashHeader } from "@/components/dash/header";

export default function NewCompanyPage() {
	return (
		<>
			<DashHeader
				description=" Aqui você pode criar uma nova empresa e definir um admin padrão."
				title="Criar uma nova empresa"
			/>
			<CreateCompany />
		</>
	);
}
