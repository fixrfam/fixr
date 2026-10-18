import { Heading } from "@/components/dashboard/heading";
import { ServicesTable } from "@/components/dashboard/services";

export default function ServicesPage() {
	return (
		<div className="space-y-4">
			<Heading
				description={"Controle os serviços oferecidos pela sua loja"}
				title={"Serviços"}
			/>

			<div className="mt-5 rounded-xs">
				<ServicesTable />
			</div>
		</div>
	);
}
