import { common } from "./common";
import { emails } from "./emails";
import { messages } from "./messages";
import { validation } from "./validation";

/** English is the default locale and the source of truth for every key. */
export const en = {
	common,
	emails,
	messages,
	validation,
} as const;
