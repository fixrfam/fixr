import { z } from "zod";
import { userJWT } from "@fixr/schemas/auth";
import { authenticateEmployee } from "@/src/middlewares/authenticateEmployee";
import { getUserCompanyHandler } from "@/src/controllers/companies/getUserCompanyHandler";
import { companiesDocs } from "@/src/docs/companies/companies.docs";
import { FastifyTypedInstance } from "@/src/interfaces/fastify";
import { getCompanyByIdSchema } from "@fixr/schemas/companies";
import { getCompanyByIdHandler } from "@/src/controllers/companies/getCompanyByIdHandler";

export async function companiesRoutes(fastify: FastifyTypedInstance) {
    fastify.get(
        "/",
        { preHandler: authenticateEmployee, schema: companiesDocs.getUserCompanySchema },
        async (request, response) => {
            const userJwt = request.user as z.infer<typeof userJWT>;

            await getUserCompanyHandler({ userJwt, response });
        }
    );

    fastify.get(
        "/:id",
        { preHandler: authenticateEmployee, schema: companiesDocs.getCompanyByIdSchema },
        async (request, response) => {
            const userJwt = request.user as z.infer<typeof userJWT>;
            const params = await getCompanyByIdSchema.parseAsync(request.params);

            await getCompanyByIdHandler({
                companyId: params.id,
                userJwt,
                response,
            });
        }
    );
}
