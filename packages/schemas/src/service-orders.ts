import { z } from "zod";
import { cpf } from "@fixr/schemas/common";

export const createOrderServiceSchema = z.object({
  customerCpf: cpf,
  // ... outros campos como data, marca, etc.
});