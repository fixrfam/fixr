import { account } from "./account";
import { apiKeys } from "./api-keys";
import { auth } from "./auth";
import { clients } from "./clients";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { emails } from "./emails";
import { employees } from "./employees";
import { messages } from "./messages";
import { permissions } from "./permissions";
import { roles } from "./roles";
import { serviceOrders } from "./service-orders";
import { validation } from "./validation";

/** English is the default locale and the source of truth for every key. */
export const en = {
	account,
	apiKeys,
	auth,
	clients,
	common,
	dashboard,
	emails,
	employees,
	messages,
	permissions,
	roles,
	serviceOrders,
	validation,
} as const;
