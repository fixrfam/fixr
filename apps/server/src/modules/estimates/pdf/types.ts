/** Everything the estimate PDF prints, already resolved from the database. */
export interface EstimatePdfData {
	number: number;
	/** The order it's for, as people refer to it (e.g. `ACME-12`). */
	serviceOrderCode: string;
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
	customer: {
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
