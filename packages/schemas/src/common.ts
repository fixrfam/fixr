import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";

const invalidFormat = i18nMessage("validation.generic.invalidFormat");

export const cnpj = z
	.string()
	.regex(/([0-9]{2}[.]?[0-9]{3}[.]?[0-9]{3}[/]?[0-9]{4}[-]?[0-9]{2})/, {
		message: invalidFormat,
	});

export const formattedCnpj = z
	.string()
	.regex(/([0-9]{2}[.]?[0-9]{3}[.]?[0-9]{3}[/]?[0-9]{4}[-]?[0-9]{2})/, {
		message: invalidFormat,
	});

export const cpf = z
	.string()
	.regex(/([0-9]{3}[.]?[0-9]{3}[.]?[0-9]{3}[-]?[0-9]{2})/, {
		message: invalidFormat,
	});
export const formattedIMEI = z.string().regex(/([0-9]{15})/, {
	message: invalidFormat,
});
