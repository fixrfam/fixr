import { z } from "zod";

export const cnpj = z
	.string()
	.regex(/([0-9]{2}[.]?[0-9]{3}[.]?[0-9]{3}[/]?[0-9]{4}[-]?[0-9]{2})/, {
		message: "Formato inválido.",
	});

export const formattedCnpj = z
	.string()
	.regex(/([0-9]{2}[.]?[0-9]{3}[.]?[0-9]{3}[/]?[0-9]{4}[-]?[0-9]{2})/, {
		message: "Formato inválido.",
	});

export const cpf = z
	.string()
	.regex(/([0-9]{3}[.]?[0-9]{3}[.]?[0-9]{3}[-]?[0-9]{2})/, {
		message: "Formato inválido.",
	});
export const formattedImei = z.string().regex(/([0-9]{15})/, {
	message: "Formato inválido.",
});

export const openData = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, {
	message: "Formato de data inválido.",
});

export const openHora = z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, {
	message: "Formato de hora inválido. Use HH:MM entre 00:00 e 23:59.",
});
