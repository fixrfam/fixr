import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { passwordSchema } from "./auth";
import { documentSchema } from "./documents";

export const createCompanySchema = z.object({
	name: z
		.string()
		.min(3, { message: i18nMessage("validation.name.atLeast", { count: 3 }) })
		.max(100, {
			message: i18nMessage("validation.name.atMost", { count: 100 }),
		}),
	cnpj: documentSchema("cnpj"),
	address: z
		.string()
		.min(3, { message: i18nMessage("validation.address.min", { count: 3 }) })
		.max(255, {
			message: i18nMessage("validation.address.max", { count: 255 }),
		})
		.optional()
		.or(z.literal("")),
	subdomain: z
		.string()
		.min(1, { message: i18nMessage("validation.subdomain.min", { count: 1 }) })
		.max(63, {
			message: i18nMessage("validation.subdomain.max", { count: 63 }),
		})
		.regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
			message:
				"Subdomain can only contain lowercase letters (a-z), numbers (0-9), and hyphens (-), but cannot start or end with a hyphen",
		}),
	owner_cpf: documentSchema("cpf"),
	owner_email: z
		.string()
		.email({ message: i18nMessage("validation.email.invalid") }),
	owner_password: passwordSchema,
});

export const getCompanyBySubdomainSchema = z.object({
	subdomain: z
		.string()
		.min(1, { message: i18nMessage("validation.subdomain.min", { count: 1 }) })
		.max(63, {
			message: i18nMessage("validation.subdomain.max", { count: 63 }),
		})
		.regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
			message:
				"Subdomain can only contain lowercase letters (a-z), numbers (0-9), and hyphens (-), but cannot start or end with a hyphen",
		}),
});

export const getCompanyNestedDataSchema = z.object({
	subdomain: z
		.string()
		.min(1, { message: i18nMessage("validation.subdomain.min", { count: 1 }) })
		.max(63, {
			message: i18nMessage("validation.subdomain.max", { count: 63 }),
		})
		.regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
			message:
				"Subdomain can only contain lowercase letters (a-z), numbers (0-9), and hyphens (-), but cannot start or end with a hyphen",
		}),
});

const invalidFormat = i18nMessage("validation.generic.invalidFormat");
const PHONE_DIGITS_REGEX = /^\d{10,11}$/;
const NON_DIGITS_REGEX = /\D/g;

/** Optional text field: an empty string clears the stored value. */
const clearable = <T extends z.ZodType>(schema: T) =>
	schema.nullable().optional().or(z.literal(""));

/**
 * @description Body schema for updating the company profile shown on documents.
 * Every field is optional; `null` or `""` clears it. The CNPJ and subdomain can't change.
 */
export const updateCompanyProfileSchema = z.object({
	name: createCompanySchema.shape.name.optional().or(z.literal("")),
	address: createCompanySchema.shape.address,
	email: clearable(
		z
			.string()
			.max(255)
			.email({ message: i18nMessage("validation.email.invalid") })
	),
	phone: clearable(
		z
			.string()
			.refine(
				(value) => PHONE_DIGITS_REGEX.test(value.replace(NON_DIGITS_REGEX, "")),
				{
					message: i18nMessage("validation.phone.incomplete"),
				}
			)
	),
	website: clearable(z.string().max(255).url({ message: invalidFormat })),
	logoUrl: clearable(z.string().max(500).url({ message: invalidFormat })),
});
