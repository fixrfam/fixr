import { account } from "./account";
import { admin } from "./admin";
import { apiKeys } from "./api-keys";
import { auth } from "./auth";
import { common } from "./common";
import { company } from "./company";
import { customers } from "./customers";
import { dashboard } from "./dashboard";
import { dataTable } from "./data-table";
import { emails } from "./emails";
import { employees } from "./employees";
import { estimates } from "./estimates";
import { home } from "./home";
import { messages } from "./messages";
import { parts } from "./parts";
import { permissions } from "./permissions";
import { portal } from "./portal";
import { roles } from "./roles";
import { serviceOrders } from "./service-orders";
import { services } from "./services";
import { suppliers } from "./suppliers";
import { validation } from "./validation";

/** English is the default locale and the source of truth for every key. */
export const en = {
	account,
	admin,
	apiKeys,
	auth,
	customers,
	common,
	company,
	dashboard,
	dataTable,
	emails,
	employees,
	estimates,
	home,
	messages,
	parts,
	permissions,
	portal,
	roles,
	serviceOrders,
	services,
	suppliers,
	validation,
} as const;
