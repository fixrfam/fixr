import { randomDelay } from "../async";

export interface SupplierRow {
	id: string;
	name: string;
	cnpj: string;
	contact: string;
	phone: string;
	email: string;
}

export const mockSuppliers: SupplierRow[] = [
	{
		id: "sup-1",
		name: "TechParts Distribuidora",
		cnpj: "12.345.678/0001-90",
		contact: "Renata Albuquerque",
		phone: "(11) 3456-7890",
		email: "vendas@techparts.com.br",
	},
	{
		id: "sup-2",
		name: "CellFix Importados",
		cnpj: "23.456.789/0001-01",
		contact: "Marcos Tavares",
		phone: "(11) 98765-4321",
		email: "marcos@cellfix.com.br",
	},
	{
		id: "sup-3",
		name: "InfoBoard Componentes",
		cnpj: "34.567.890/0001-12",
		contact: "Juliana Prado",
		phone: "(19) 3232-1010",
		email: "comercial@infoboard.com.br",
	},
	{
		id: "sup-4",
		name: "Power Cell Baterias",
		cnpj: "45.678.901/0001-23",
		contact: "Diego Nascimento",
		phone: "(21) 99888-7766",
		email: "diego@powercell.com.br",
	},
	{
		id: "sup-5",
		name: "VisionTV Peças",
		cnpj: "56.789.012/0001-34",
		contact: "Patrícia Moreira",
		phone: "(31) 3344-5566",
		email: "atendimento@visiontv.com.br",
	},
	{
		id: "sup-6",
		name: "Sul Eletrônicos Atacado",
		cnpj: "67.890.123/0001-45",
		contact: "Felipe Schneider",
		phone: "(51) 3030-4040",
		email: "felipe@suleletronicos.com.br",
	},
];

export async function getSuppliers(): Promise<SupplierRow[]> {
	await randomDelay(); // Simulate API delay
	return mockSuppliers;
}
