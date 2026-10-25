import { db } from "@fixr/db/connection";
import { companies } from "@fixr/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { nextSeq, uniqueDigits } from "./sequence";

export interface MakeCompanyInput {
	name?: string;
	subdomain?: string;
	cnpj?: string;
}

export async function makeCompany(input: MakeCompanyInput = {}) {
	const seq = nextSeq();
	const company = {
		id: createId(),
		name: input.name ?? `Company ${seq}`,
		subdomain: input.subdomain ?? `company-${seq}`,
		cnpj: input.cnpj ?? uniqueDigits(14),
		address: null,
	};

	await db.insert(companies).values(company);

	return company;
}

export type TestCompany = Awaited<ReturnType<typeof makeCompany>>;
