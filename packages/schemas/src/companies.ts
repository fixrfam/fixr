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
