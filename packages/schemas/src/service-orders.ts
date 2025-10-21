import { z } from "zod";

export const createOrderServiceSchema = z.object({
  customerCpf: z.string().min(14, "CPF inválido").max(14, "CPF inválido"),
  // ... outros campos como data, marca, etc.
});