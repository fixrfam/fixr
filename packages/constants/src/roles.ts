import type { employeeRoles } from "@fixr/schemas/roles";
import type * as z from "zod";

export const roleLabels: Record<z.infer<typeof employeeRoles>, string> = {
	guest: "Visitante",
	admin: "Administrador",
	manager: "Gerente",
	financial: "Financeiro",
	warehouse: "Estoquista",
	technician: "Técnico",
};
