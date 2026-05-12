export type { DeviceOption } from "./options/devices";
export { getDevices, mockDevices } from "./options/devices";

export type { EmployeeOption } from "./options/employees";
export { getEmployees, mockEmployees } from "./options/employees";

export type {
	LineOption,
	StatusOption,
	TechnicianOption,
} from "./options/filter-order";
export {
	getFilterOptions,
	getLines,
	getStatuses,
	getTechnicians,
} from "./options/filter-order";

export type { ServiceOrderRow } from "./options/table-order";
export {
	mockServiceOrders as mockServiceOrdersTable,
	mockServiceOrders,
} from "./options/table-order";
