import type { Translated } from "../../types";
import type { en } from "../en";
import { auth } from "./auth";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { emails } from "./emails";
import { messages } from "./messages";
import { validation } from "./validation";

export const ptBR: Translated<typeof en> = {
	auth,
	common,
	dashboard,
	emails,
	messages,
	validation,
};
