import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { documentSchema } from "./documents";

export const createClientSchema = z.object({
	name: z.string().min(1, i18nMessage("validation.name.required")),
	email: z
		.string()
		.email(i18nMessage("validation.email.invalid"))
		.min(1, i18nMessage("validation.email.required")),
	cpf: documentSchema("cpf"),
	phone: z.string().min(1, i18nMessage("validation.phone.required")),
	alternativePhone: z.string().optional(),
	address: z.string().min(1, i18nMessage("validation.address.required")),
	state: z.string().min(2, i18nMessage("validation.state.required")).max(2),
	city: z.string().min(1, i18nMessage("validation.city.required")),
});
