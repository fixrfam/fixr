import { FastifyReply } from "fastify";

import { apiResponse } from "@/src/helpers/response";
import { z } from "zod";
import { jwtPayload } from "@repo/schemas/auth";
import { queryUserByEmail } from "@/src/services/auth.services";
import { createEmployeeSchema } from "@repo/schemas/employees";
import { employeeRoles } from "@repo/schemas/roles";
import {
    createEmployeeAndAccount,
    getEmployeeByCpf,
} from "@/src/services/companies/employees/employees.services";
import { generateRandomPassword } from "@/src/helpers/generate-password";
import { createEmailQueue, queueEmail } from "@repo/mail/queue";
import { redis } from "@/src/config/redis";
import { APP_NAME } from "@repo/constants/app";
import { env } from "@/src/env";
import { emailDisplayName } from "@repo/mail/services";

export async function registerEmployeeHandler({
    userJwt,
    companyId,
    data,
    response,
}: {
    userJwt: z.infer<typeof jwtPayload>;
    companyId: string;
    data: z.infer<typeof createEmployeeSchema>;
    response: FastifyReply;
}) {
    if (!userJwt.company) {
        return response.status(404).send(
            apiResponse({
                status: 404,
                error: "Not Found",
                code: "company_not_found",
                message: "There's no companies bound to your account",
                data: null,
            })
        );
    }

    const allowedRoles = ["admin", "manager"] as z.infer<typeof employeeRoles>[];
    const isSameCompany = userJwt.company.id === companyId;
    const isPrivilegedUser = allowedRoles.includes(userJwt.company.role);

    if (!isSameCompany || !isPrivilegedUser) {
        return response.status(403).send(
            apiResponse({
                status: 403,
                error: "Forbidden",
                code: "not_allowed",
                message: "You are not allowed to perform this action.",
                data: null,
            })
        );
    }

    // Managers cannot create admin employees.
    const violatesRoleHierarchy = userJwt.company.role === "manager" && data.role === "admin";

    if (violatesRoleHierarchy) {
        return response.status(403).send(
            apiResponse({
                status: 403,
                error: "Forbidden",
                code: "violates_role_hierarchy",
                message: "Managers may only create subordinate accounts.",
                data: null,
            })
        );
    }

    const existingEmailQuery = queryUserByEmail(data.email);
    const existingCpfQuery = getEmployeeByCpf(data.cpf);

    const [existingEmail, existingCpf] = await Promise.all([existingEmailQuery, existingCpfQuery]);

    if (existingEmail) {
        return response.status(409).send(
            apiResponse({
                status: 409,
                error: "Conflict",
                code: "email_already_used",
                message: "Email is already registered.",
                data: null,
            })
        );
    }

    if (existingCpf) {
        return response.status(409).send(
            apiResponse({
                status: 409,
                error: "Conflict",
                code: "cpf_conflict",
                message: "Cpf is already registered.",
                data: null,
            })
        );
    }

    const employeePassword = data.password ?? generateRandomPassword();

    await createEmployeeAndAccount({ data: { ...data, password: employeePassword }, companyId });

    const emailQueue = createEmailQueue(redis);

    await queueEmail(emailQueue, {
        job: "sendInviteEmail",
        payload: {
            to: data.email,
            appName: APP_NAME,
            companyName: userJwt.company.name,
            ctaUrl: `${env.FRONTEND_URL}/auth/login`,
            displayName: data.name,
            password: employeePassword,
            credentials: {
                email_user: env.EMAIL_USER,
                email_pass: env.EMAIL_PASSWORD,
            },
        },
    });

    return response.status(201).send(
        apiResponse({
            status: 201,
            error: null,
            code: "create_employee_success",
            message: "Employee created successfully.",
            data: null,
        })
    );
}
