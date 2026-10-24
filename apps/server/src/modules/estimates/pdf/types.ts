/** Everything the estimate PDF prints, already resolved from the database. */
export interface EstimatePdfData {
	number: number;
	issuedAt: Date;
	validUntil: Date;
	discountPercentage: number;
	notes: string | null;
	company: {
		name: string;
		cnpj: string;
		address: string | null;
		email: string | null;
		phone: string | null;
		website: string | null;
		/** Logo image bytes, or null to print the Fixr logo. */
		logo: Buffer | null;
	};
	client: {
		name: string;
		cpf: string;
		email: string | null;
		phone: string | null;
		address: string | null;
		city: string | null;
		state: string | null;
	} | null;
	device: {
		maker: string;
		model: string;
		reportedDefect: string;
	};
	items: {
		name: string;
		type: "part" | "service";
		quantity: number;
		unitPrice: number;
		total: number;
	}[];
	totals: { subtotal: number; discount: number; total: number };
}
