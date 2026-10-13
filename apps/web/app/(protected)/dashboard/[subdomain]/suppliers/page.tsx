import { Heading } from "@/components/dashboard/heading";
import { SuppliersTable } from "@/components/dashboard/parts";

export default function SuppliersPage() {
	return (
		<div className="space-y-4">
			<Heading
				description={"Controle os fornecedores das peças da sua loja"}
				title={"Fornecedores"}
			/>

			<div className="mt-5 rounded-xs">
				<SuppliersTable />
			</div>
		</div>
	);
}
