import { db } from "@fixr/db/connection";
import { clients } from "@fixr/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { nextSeq, uniqueDigits } from "./sequence";
import { type MakeUserInput, makeUser } from "./user";

/** A client account (user + clients row), i.e. a regular non-employee login. */
export async function makeClient(
	input: MakeUserInput & { name?: string } = {}
) {
	const user = await makeUser(input);
	const client = {
		id: createId(),
		name: input.name ?? `Client ${nextSeq()}`,
		cpf: uniqueDigits(11),
		phone: null,
		userId: user.id,
	};

	await db.insert(clients).values(client);

	return { ...client, user };
}
