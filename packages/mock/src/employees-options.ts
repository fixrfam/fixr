export interface EmployeeOption {
	id: string;
	name: string;
}

export const mockEmployees: EmployeeOption[] = [
	{ id: "001", name: "João Silva" },
	{ id: "002", name: "Maria Santos" },
	{ id: "003", name: "Carlos Oliveira" },
	{ id: "004", name: "Ana Costa" },
	{ id: "005", name: "Pedro Ferreira" },
];

export function getEmployees(): EmployeeOption[] {
	// TODO: Replace with API call to /api/employees
	return mockEmployees;
}
