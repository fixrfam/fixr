import { z } from "zod";

export const updateAvatarSchema = z.object({
	url: z.string().url({ message: "URL da foto deve ser uma URL válida." }),
});
