import type { EmployeeRole } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import type { z } from "zod";

/** A signed-in employee of the `fixr` company, for components that read the session role. */
export function employeeSession(
	role: EmployeeRole = "admin"
): z.infer<typeof userJWT> {
	return {
		id: "ckx1y2z3a4b5c6d7e8f9g0h1",
		email: "maria@fixr.test",
		displayName: "Maria",
		avatarUrl: null,
		profileType: "employee",
		company: {
			id: "ckx1y2z3a4b5c6d7e8f9g0h2",
			name: "Fixr",
			subdomain: "fixr",
			role,
		},
		createdAt: new Date(),
		iat: 1,
		exp: 9_999_999_999,
	} as z.infer<typeof userJWT>;
}
