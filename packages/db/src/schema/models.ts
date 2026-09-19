import { createId } from "@paralleldrive/cuid2";
import {
	float,
	int,
	mysqlTable,
	text,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/mysql-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./companies";
import { modelCategories } from "./model-categories";
import { modelMakers } from "./model-makers";

export const models = mysqlTable(
	"models",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		makerId: varchar("maker_id", { length: 25 })
			.notNull()
			.references(() => modelMakers.id),
		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 100 }).notNull(),
		url: varchar("url", { length: 255 }).notNull(),

		categoryId: varchar("category_id", { length: 25 }).references(
			() => modelCategories.id
		),

		announced: text("announced"),
		status: text("status"),
		dimensions: text("dimensions"),
		weight: text("weight"),
		build: text("build"),
		sim: text("sim"),
		displayType: text("display_type"),
		displaySize: text("display_size"),
		displayResolution: text("display_resolution"),
		displayProtection: text("display_protection"),
		os: text("os"),
		chipset: text("chipset"),
		cpu: text("cpu"),
		gpu: text("gpu"),
		cardSlot: text("card_slot"),
		internalMemory: text("internal_memory"),
		mainCamera: text("main_camera"),
		mainCameraFeatures: text("main_camera_features"),
		mainCameraVideo: text("main_camera_video"),
		selfieCamera: text("selfie_camera"),
		selfieFeatures: text("selfie_features"),
		selfieVideo: text("selfie_video"),
		battery: text("battery"),
		batteryCharging: text("battery_charging"),
		networkTech: text("network_tech"),
		sensors: text("sensors"),
		colors: text("colors"),
		colorsHex: text("colors_hex"),
		modelsText: text("models_text"),
		price: text("price"),
		dimensionsWidth: float("dimensions_width"),
		dimensionsHeight: float("dimensions_height"),
		dimensionsThickness: float("dimensions_thickness"),
		weightGrams: float("weight_grams"),
		displaySizeInches: float("display_size_inches"),
		displaySizeRatio: text("display_size_ratio"),
		displayResWidth: int("display_res_width"),
		displayResHeight: int("display_res_height"),
		displayResPpi: int("display_res_ppi"),
		released: text("released"),

		meta: text("meta"),

		companyId: varchar("company_id", { length: 25 }).references(
			() => companies.id
		),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		slugCompanyUnique: unique("slug_company_unique").on(
			table.slug,
			table.companyId
		),
	})
);

export const modelSelectSchema = createSelectSchema(models, {
	createdAt: z.coerce.date(),
});
export type ModelInsert = typeof models.$inferInsert;
export type ModelSelect = typeof models.$inferSelect;
