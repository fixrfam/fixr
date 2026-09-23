import type { Translated } from "../../types";
import type { roles as source } from "../en/roles";

export const roles: Translated<typeof source> = {
	guest: "Visitante",
	admin: "Administrador",
	manager: "Gerente",
	financial: "Financeiro",
	warehouse: "Estoquista",
	technician: "Técnico",
} as const;
