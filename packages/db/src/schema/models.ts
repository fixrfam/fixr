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
import { categories } from "./categories";
import { companies } from "./companies";
import { makers } from "./makers";

export const models = mysqlTable(
	"models",
	{
		id: varchar("id", { length: 25 })
			.$defaultFn(() => createId())
			.primaryKey(),
		makerId: varchar("maker_id", { length: 25 })
			.notNull()
			.references(() => makers.id),
		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 100 }).notNull(),
		url: varchar("url", { length: 255 }).notNull(),
		imageUrl: varchar("image_url", { length: 255 }),
		imageLocalPath: varchar("image_local_path", { length: 255 }),

		categoryId: varchar("category_id", { length: 25 }).references(
			() => categories.id
		),

		announced: varchar("announced", { length: 100 }),
		status: varchar("status", { length: 100 }),
		dimensions: varchar("dimensions", { length: 255 }),
		weight: varchar("weight", { length: 100 }),
		build: varchar("build", { length: 255 }),
		sim: varchar("sim", { length: 100 }),
		displayType: varchar("display_type", { length: 255 }),
		displaySize: varchar("display_size", { length: 100 }),
		displayResolution: varchar("display_resolution", { length: 100 }),
		displayProtection: varchar("display_protection", { length: 100 }),
		os: varchar("os", { length: 255 }),
		chipset: varchar("chipset", { length: 255 }),
		cpu: varchar("cpu", { length: 255 }),
		gpu: varchar("gpu", { length: 255 }),
		cardSlot: varchar("card_slot", { length: 255 }),
		internalMemory: varchar("internal_memory", { length: 255 }),
		mainCamera: varchar("main_camera", { length: 255 }),
		mainCameraFeatures: text("main_camera_features"),
		mainCameraVideo: varchar("main_camera_video", { length: 255 }),
		selfieCamera: varchar("selfie_camera", { length: 255 }),
		selfieFeatures: text("selfie_features"),
		selfieVideo: varchar("selfie_video", { length: 255 }),
		battery: varchar("battery", { length: 255 }),
		batteryCharging: varchar("battery_charging", { length: 255 }),
		networkTech: varchar("network_tech", { length: 255 }),
		sensors: varchar("sensors", { length: 255 }),
		colors: varchar("colors", { length: 255 }),
		colorsHex: text("colors_hex"),
		modelsText: varchar("models_text", { length: 255 }),
		price: varchar("price", { length: 100 }),
		dimensionsWidth: float("dimensions_width"),
		dimensionsHeight: float("dimensions_height"),
		dimensionsThickness: float("dimensions_thickness"),
		weightGrams: float("weight_grams"),
		displaySizeInches: float("display_size_inches"),
		displaySizeRatio: varchar("display_size_ratio", { length: 100 }),
		displayResWidth: int("display_res_width"),
		displayResHeight: int("display_res_height"),
		displayResPpi: int("display_res_ppi"),
		released: varchar("released", { length: 100 }),

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
