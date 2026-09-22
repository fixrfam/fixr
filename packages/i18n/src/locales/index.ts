import type { Locale } from "../config";
import type { Messages, Translated } from "../types";
import { en } from "./en";
import { ptBR } from "./pt-BR";

export { en } from "./en";
export { ptBR } from "./pt-BR";

/** Every catalog the app can serve, keyed by locale. */
export const catalogs: Record<Locale, Translated<Messages>> = {
	en,
	"pt-BR": ptBR,
};
