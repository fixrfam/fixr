import { db } from "@fixr/db/connection";
import { clients } from "@fixr/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { nextSeq, uniqueDigits } from "./sequence";
import { makeUser } from "./user";

export async function makeClient(input: { name?: string } = {}) {
	const user = await makeUser();
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
