import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { createEmployeeSchema } from "@fixr/schemas/employees";
import { getPaginatedDataSchema } from "@fixr/schemas/utils";
import { Elysia, t } from "elysia";
import { getCompanyEmployeesHandler } from "@/src/controllers/companies/employees/get-company-employees-handler";
import { registerEmployeeHandler } from "@/src/controllers/companies/employees/register-employee-handler";
import { authenticateEmployee } from "@/src/middlewares/authenticate-employee";
import type { AuthenticatedContext } from "../../../helpers/elysia";

export const employeesRoutes = new Elysia({
	prefix: "/companies/:subdomain/employees",
})
	.use(authenticateEmployee)
	.get(
		"/",
		async (ctx) => {
			const { params, query, userJwt, set } =
				ctx as unknown as AuthenticatedContext & {
					params: { subdomain: string };
					query: Record<string, string>;
					set: { status: number };
				};
			const { subdomain } = getCompanyNestedDataSchema.parse(params);
			const {
				query: q,
				sort,
				page,
				perPage,
			} = getPaginatedDataSchema.parse(query);
			const result = await getCompanyEmployeesHandler({
				subdomain,
				userJwt,
				page,
				perPage,
				query: q,
				sort,
			});
			set.status = result.status;
			return result.response;
		},
		{
			query: t.Object({
				query: t.Optional(t.String()),
				sort: t.Optional(t.String()),
				page: t.Optional(t.Numeric()),
				perPage: t.Optional(t.Numeric()),
			}),
		}
	)
	.post(
		"/",
		async (ctx) => {
			const { params, body, userJwt, set } =
				ctx as unknown as AuthenticatedContext & {
					params: { subdomain: string };
					body: Record<string, unknown>;
					set: { status: number };
				};
			const { subdomain } = getCompanyNestedDataSchema.parse(params);
			const validBody = await createEmployeeSchema.parseAsync(body);
			const result = await registerEmployeeHandler({
				userJwt,
				data: validBody,
				subdomain,
			});
			set.status = result.status;
			return result.response;
		},
		{
			body: t.Object({
				name: t.String(),
				email: t.String({ format: "email" }),
				cpf: t.String(),
				role: t.String(),
				phone: t.Optional(t.String()),
				password: t.Optional(t.String()),
			}),
		}
	);
