import { Heading } from "@/components/dashboard/heading";
import { PartsTabs } from "@/components/dashboard/parts";

export default function PartsPage() {
	return (
		<div className="space-y-4">
			<Heading
				description={"Controle as peças e serviços da sua loja"}
				title={"Peças e serviços"}
			/>

			<div className="mt-5 rounded-xs">
				<PartsTabs />
			</div>
		</div>
	);
}
