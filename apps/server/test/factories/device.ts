import { slugify } from "@fixr/constants/slug";
import { db } from "@fixr/db/connection";
import { modelCategories, modelMakers, models, uploads } from "@fixr/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { nextSeq } from "./sequence";

export async function makeMaker(input: { name?: string } = {}) {
	const name = input.name ?? `Maker ${nextSeq()}`;
	const slug = slugify(name);
	const maker = {
		id: createId(),
		name,
		slug,
		url: `/makers/${slug}`,
		deviceCount: 0,
	};

	await db.insert(modelMakers).values(maker);

	return maker;
}

export async function makeCategory(input: { name?: string } = {}) {
	const name = input.name ?? `Category ${nextSeq()}`;
	const category = { id: createId(), name, slug: slugify(name) };

	await db.insert(modelCategories).values(category);

	return category;
}

export async function makeModel(input: {
	makerId: string;
	companyId: string | null;
	categoryId?: string | null;
	name?: string;
	status?: string;
}) {
	const name = input.name ?? `Model ${nextSeq()}`;
	const slug = slugify(name);
	const model = {
		id: createId(),
		makerId: input.makerId,
		categoryId: input.categoryId ?? null,
		companyId: input.companyId,
		name,
		slug,
		url: `/models/${slug}`,
		status: input.status ?? "Available",
	};

	await db.insert(models).values(model);

	return model;
}

export async function makeUpload(input: {
	companyId: string | null;
	employeeId?: string | null;
	purpose?: "avatar" | "service_order" | "model_image";
}) {
	const seq = nextSeq();
	const key = `companies/${input.companyId}/uploads/${seq}.jpg`;
	const upload = {
		id: createId(),
		companyId: input.companyId,
		employeeId: input.employeeId ?? null,
		purpose: input.purpose ?? "service_order",
		key,
		url: `https://cdn.test.local/${key}`,
		fileName: `${seq}.jpg`,
		contentType: "image/jpeg",
		sizeInBytes: 1024,
		status: "pending",
	};

	await db.insert(uploads).values(upload);

	return upload;
}
