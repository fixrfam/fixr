import { getCompanyBySubdomainSchema } from "@fixr/schemas/companies";
import { Elysia } from "elysia";
import { getCompanyBySubdomainHandler } from "@/src/controllers/companies/get-company-by-id-handler";
import { getUserCompanyHandler } from "@/src/controllers/companies/get-user-company-handler";
import { authenticateEmployee } from "@/src/middlewares/authenticate-employee";
import type { AuthenticatedContext } from "../../helpers/elysia";

export const companiesRoutes = new Elysia({ prefix: "/companies" })
	.use(authenticateEmployee)
	.get("/", async (ctx) => {
		const { userJwt, set } = ctx as unknown as AuthenticatedContext & {
			set: { status: number };
		};
		const result = await getUserCompanyHandler({ userJwt });
		set.status = result.status;
		return result.response;
	})
	.get("/:subdomain", async (ctx) => {
		const { params, userJwt, set } = ctx as unknown as AuthenticatedContext & {
			params: { subdomain: string };
			set: { status: number };
		};
		const { subdomain } = await getCompanyBySubdomainSchema.parseAsync(params);
		const result = await getCompanyBySubdomainHandler({ subdomain, userJwt });
		set.status = result.status;
		return result.response;
	});
