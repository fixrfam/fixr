import { db } from "@fixr/db/connection";
import { customers } from "@fixr/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { nextSeq, uniqueDigits } from "./sequence";
import { type MakeUserInput, makeUser } from "./user";

/**
 * A customer account (user + customers row), i.e. a regular non-employee login.
 * Pass `companyId` to make it a customer of that company.
 */
export async function makeCustomerAccount(
	input: MakeUserInput & { name?: string; companyId?: string } = {}
) {
	const user = await makeUser(input);
	const customer = {
		id: createId(),
		companyId: input.companyId ?? null,
		name: input.name ?? `Customer ${nextSeq()}`,
		cpf: uniqueDigits(11),
		phone: null,
		userId: user.id,
	};

	await db.insert(customers).values(customer);

	return { ...customer, user };
}

/** A customer registered by the company, without a login. */
export async function makeCustomer(input: {
	companyId: string;
	name?: string;
	cpf?: string;
	email?: string | null;
	deletedAt?: Date;
}) {
	const seq = nextSeq();
	const customer = {
		id: createId(),
		companyId: input.companyId,
		name: input.name ?? `Customer ${seq}`,
		cpf: input.cpf ?? uniqueDigits(11),
		email:
			input.email === undefined ? `customer-${seq}@fixr.test` : input.email,
		phone: "11999999999",
		address: "Rua Exemplo, 123",
		city: "São Paulo",
		state: "SP",
		deletedAt: input.deletedAt ?? null,
	};

	await db.insert(customers).values(customer);

	return customer;
}
