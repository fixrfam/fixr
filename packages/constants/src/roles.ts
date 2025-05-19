import * as z from "zod";

import { employeeRoles } from "@fixr/schemas/roles";

export const roleLabels: Record<z.infer<typeof employeeRoles>, string> = {
    admin: "Administrador",
    manager: "Gerente",
    financial: "Financeiro",
    warehouse: "Estoquista",
    technician: "Técnico",
};
