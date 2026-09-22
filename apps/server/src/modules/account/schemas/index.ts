import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";

export const updateAvatarSchema = z.object({
	url: z.string().url({ message: i18nMessage("validation.upload.urlInvalid") }),
});
