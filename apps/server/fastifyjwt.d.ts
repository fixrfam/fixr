import "fastify";
import { nonSensitiveUser } from "@repo/schemas/auth";
import { z } from "zod";

declare const userJWT = nonSensitiveUser.extend({
    iat: z.number(),
    exp: z.number(),
});

declare module "fastify" {
    interface FastifyRequest {
        user: z.infer<typeof userJWT>;
    }
}
