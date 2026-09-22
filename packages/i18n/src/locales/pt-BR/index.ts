import type { Translated } from "../../types";
import type { en } from "../en";
import { common } from "./common";
import { emails } from "./emails";
import { messages } from "./messages";
import { validation } from "./validation";

export const ptBR: Translated<typeof en> = {
	common,
	emails,
	messages,
	validation,
};
