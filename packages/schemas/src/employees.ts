import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { passwordSchema } from "./auth";
import { documentSchema } from "./documents";
import { employeeRoles } from "./roles";

export const createEmployeeSchema = z.object({
	name: z
		.string({ error: i18nMessage("validation.generic.required") })
		.min(3, { message: i18nMessage("validation.name.min", { count: 3 }) })
		.max(100, { message: i18nMessage("validation.name.max") }),
	cpf: documentSchema("cpf"),
	phone: z
		.string()
		.length(11, { message: i18nMessage("validation.phone.incomplete") })
		.optional()
		.nullable(),
	role: employeeRoles,
	email: z
		.string({ error: i18nMessage("validation.generic.required") })
		.email({ message: i18nMessage("validation.email.invalid") }),
	password: passwordSchema.optional(),
});
