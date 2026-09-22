import { auth } from "./auth";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { emails } from "./emails";
import { messages } from "./messages";
import { validation } from "./validation";

/** English is the default locale and the source of truth for every key. */
export const en = {
	auth,
	common,
	dashboard,
	emails,
	messages,
	validation,
} as const;
