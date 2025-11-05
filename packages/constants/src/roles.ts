import { employeeRoles } from "@fixr/schemas/roles"
import * as z from "zod"

export const roleLabels: Record<z.infer<typeof employeeRoles>, string> = {
  admin: "Administrador",
  manager: "Gerente",
  financial: "Financeiro",
  warehouse: "Estoquista",
  technician: "Técnico",
}
