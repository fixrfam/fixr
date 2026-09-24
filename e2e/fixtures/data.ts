/**
 * Deterministic e2e data. Only the two companies and their admins are
 * inserted directly (company creation needs a Clerk admin session and
 * public sign-up is disabled); every other record is created through the
 * API in global-setup, so seeding also exercises the API.
 */
export const PASSWORD = "E2e!Passw0rd";

export const COMPANY_A = {
	name: "Assistência Alfa",
	subdomain: "alfa",
	cnpj: "11222333000181",
	admin: { name: "Ana Admin", email: "admin@alfa.test", cpf: "52998224725" },
};

export const COMPANY_B = {
	name: "Assistência Beta",
	subdomain: "beta",
	cnpj: "11444777000161",
	admin: { name: "Bruno Admin", email: "admin@beta.test", cpf: "11144477735" },
};

/** Employees created through POST /companies/alfa/employees, one per role. */
export const ALFA_EMPLOYEES = [
	{
		role: "manager",
		name: "Marcos Gerente",
		email: "manager@alfa.test",
		cpf: "39053344705",
	},
	{
		role: "technician",
		name: "Tiago Técnico",
		email: "technician@alfa.test",
		cpf: "71428793860",
	},
	{
		role: "warehouse",
		name: "Wagner Estoque",
		email: "warehouse@alfa.test",
		cpf: "86288366757",
	},
	{
		role: "financial",
		name: "Fernanda Financeiro",
		email: "financial@alfa.test",
		cpf: "01234567890",
	},
	{
		role: "guest",
		name: "Gabriel Visitante",
		email: "guest@alfa.test",
		cpf: "98765432100",
	},
] as const;

export type SeededRole = "admin" | (typeof ALFA_EMPLOYEES)[number]["role"];

export const ROLE_EMAILS: Record<SeededRole, string> = {
	admin: COMPANY_A.admin.email,
	...Object.fromEntries(ALFA_EMPLOYEES.map((e) => [e.role, e.email])),
} as Record<SeededRole, string>;
