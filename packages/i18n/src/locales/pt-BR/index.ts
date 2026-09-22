import type { Translated } from "../../types";
import type { en } from "../en";
import { account } from "./account";
import { admin } from "./admin";
import { apiKeys } from "./api-keys";
import { auth } from "./auth";
import { clients } from "./clients";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { dataTable } from "./data-table";
import { emails } from "./emails";
import { employees } from "./employees";
import { home } from "./home";
import { messages } from "./messages";
import { permissions } from "./permissions";
import { roles } from "./roles";
import { serviceOrders } from "./service-orders";
import { validation } from "./validation";

export const ptBR: Translated<typeof en> = {
	account,
	admin,
	apiKeys,
	auth,
	clients,
	common,
	dashboard,
	dataTable,
	emails,
	employees,
	home,
	messages,
	permissions,
	roles,
	serviceOrders,
	validation,
};
