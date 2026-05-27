import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createServiceOrderMockSchema,
	getServiceOrdersQuerySchema,
} from "@fixr/schemas/service-orders";
import type { z } from "zod";
import { createServiceOrderHandler } from "@/src/controllers/service-orders/create-service-order-handler";
import { getCompanyServiceOrdersHandler } from "@/src/controllers/service-orders/get-company-service-orders-handler";
import { serviceOrdersDocs } from "@/src/docs/companies/service-orders/service-orders.docs";
import { FastifyTypedInstance } from "@/src/core/interfaces/fastify";
import { withErrorHandler } from "@/src/core/middlewares/with-error-handler";
import { authenticateEmployee } from "@/src/core/middlewares/authenticate-employee";


export function serviceOrdersRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: authenticateEmployee,
			schema: serviceOrdersDocs.getCompanyServiceOrdersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getServiceOrdersQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await getCompanyServiceOrdersHandler({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: authenticateEmployee,
			schema: serviceOrdersDocs.createServiceOrderSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const body = await createServiceOrderMockSchema.parseAsync(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await createServiceOrderHandler({
				userJwt,
				data: body,
				subdomain,
				response,
			});
		})
	);
}
