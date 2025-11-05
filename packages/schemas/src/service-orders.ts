import { cpf } from "@fixr/schemas/common"
import { z } from "zod"

export const createOrderServiceSchema = z.object({
  customerCpf: cpf,
  // ... outros campos como data, marca, etc.
})
