import { Heading } from "@/components/dashboard/heading";
import { PartsTable } from "@/components/dashboard/parts";

export default function PartsPage() {
	return (
		<div className="space-y-4">
			<Heading
				description={"Controle as peças dos seus aparelhos"}
				title={"Peças"}
			/>

			<div className="mt-5 rounded-xs">
				<PartsTable />
			</div>
		</div>
	);
}
