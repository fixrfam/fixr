import { cookieKey } from "@fixr/constants/cookies";
import type { EmployeeRole } from "@fixr/permissions";
import type { InjectOptions } from "fastify";
import type { FastifyTypedInstance } from "@/src/core/interfaces/fastify";
import { makeCompany, makeEmployee, type TestCompany } from "../factories";

export const SESSION_COOKIE = cookieKey("session");
export const REFRESH_COOKIE = cookieKey("refreshToken");

interface SessionSubject {
	id: string;
	email: string;
	name?: string | null;
	createdAt?: Date;
	company?: { id: string; name: string; subdomain: string; role: EmployeeRole };
}

/** Signs a session JWT exactly like the API does (same secret, same payload shape). */
export function signSession(
	app: FastifyTypedInstance,
	subject: SessionSubject,
	options: { expiresIn?: string | number } = {}
) {
	return app.jwt.sign(
		{
			id: subject.id,
			email: subject.email,
			displayName: subject.name ?? null,
			avatarUrl: null,
			profileType: subject.company ? "employee" : "client",
			company: subject.company,
			createdAt: subject.createdAt ?? new Date(),
		},
		{ expiresIn: options.expiresIn ?? "5m" }
	);
}

/**
 * Creates a real employee (user + employee rows) with the given role and
 * returns it with a valid session token. Every RBAC test builds on this.
 */
export async function createEmployeeSession(
	app: FastifyTypedInstance,
	{ role, company }: { role: EmployeeRole; company?: TestCompany }
) {
	const targetCompany = company ?? (await makeCompany());
	const employee = await makeEmployee({ company: targetCompany, role });
	const token = signSession(app, {
		id: employee.user.id,
		email: employee.user.email,
		name: employee.name,
		company: {
			id: targetCompany.id,
			name: targetCompany.name,
			subdomain: targetCompany.subdomain,
			role,
		},
	});

	return { employee, company: targetCompany, token };
}

/** `app.inject()` with the session cookie set. */
export function authedInject(
	app: FastifyTypedInstance,
	token: string,
	options: InjectOptions
) {
	return app.inject({
		...options,
		cookies: { ...(options.cookies ?? {}), [SESSION_COOKIE]: token },
	});
}
