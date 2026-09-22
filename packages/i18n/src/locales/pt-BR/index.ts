import type { Translated } from "../../types";
import type { en } from "../en";
import { account } from "./account";
import { apiKeys } from "./api-keys";
import { auth } from "./auth";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { emails } from "./emails";
import { messages } from "./messages";
import { permissions } from "./permissions";
import { roles } from "./roles";
import { validation } from "./validation";

export const ptBR: Translated<typeof en> = {
	account,
	apiKeys,
	auth,
	common,
	dashboard,
	emails,
	messages,
	permissions,
	roles,
	validation,
};
