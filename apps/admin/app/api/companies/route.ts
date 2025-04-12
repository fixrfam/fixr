import {
    getEmployeeByCpf,
    getCompanyByCnpj,
    getUserByEmail,
    getCompanyBySubdomain,
    createOrgWithAdmin,
} from "@/lib/services/companies";
import { apiResponse, tryCatch } from "@/lib/utils";
import { unmask } from "@repo/constants/masks";
import { APP_NAME } from "@repo/constants/app";
import { emailDisplayName } from "@repo/mail/services";
import { createCompanySchema } from "@repo/schemas/companies";
import { NextRequest, NextResponse } from "next/server";
import { createEmailQueue, queueEmail } from "@repo/mail/queue";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
    const { data, error } = await tryCatch(createCompanySchema.parseAsync(await req.json()));

    if (error)
        return NextResponse.json(
            apiResponse({
                status: 400,
                error: "Bad request",
                code: "schema_mismatch",
                message: "Schema mismatch the expected one.",
                data: null,
            })
        );

    const formatted = {
        ...data,
        subdomain: data.subdomain.toLowerCase(),
        cnpj: unmask.cnpj(data.cnpj),
        owner_cpf: unmask.cpf(data.owner_cpf),
    };

    const [existingEmployee, existingCompany, existingEmail, existingSubdomain] = await Promise.all(
        [
            getEmployeeByCpf(formatted.owner_cpf),
            getCompanyByCnpj(formatted.cnpj),
            getUserByEmail(formatted.owner_email),
            getCompanyBySubdomain(formatted.subdomain),
        ]
    );

    if (existingEmployee)
        return NextResponse.json(
            apiResponse({
                status: 409,
                error: "Conflict",
                code: "cpf_conflict",
                message: "CPF is already registered.",
                data: null,
            }),
            { status: 409 }
        );

    if (existingCompany)
        return NextResponse.json(
            apiResponse({
                status: 409,
                error: "Conflict",
                code: "cnpj_conflict",
                message: "CNPJ is already registered.",
                data: null,
            }),
            { status: 409 }
        );

    if (existingEmail)
        return NextResponse.json(
            apiResponse({
                status: 409,
                error: "Conflict",
                code: "email_already_exists",
                message: "Email is already used.",
                data: null,
            }),
            { status: 409 }
        );

    if (existingSubdomain)
        return NextResponse.json(
            apiResponse({
                status: 409,
                error: "Conflict",
                code: "subdomain_taken",
                message: "Subdomain is already taken.",
                data: null,
            }),
            { status: 409 }
        );

    await createOrgWithAdmin(data);

    const emailQueue = createEmailQueue(redis);

    await queueEmail(emailQueue, {
        job: "sendInviteEmail",
        payload: {
            to: data.owner_email,
            appName: APP_NAME,
            companyName: data.name,
            ctaUrl: `${process.env.FRONTEND_URL}/auth/login`,
            displayName: `Admin - ${emailDisplayName(data.owner_email)}`,
            password: data.owner_password,
            credentials: {
                email_user: process.env.EMAIL_USER as string,
                email_pass: process.env.EMAIL_PASSWORD as string,
            },
        },
    });

    return NextResponse.json(
        apiResponse({
            status: 201,
            error: null,
            code: "company_create_success",
            message: "Company created successfully.",
            data: null,
        }),
        { status: 201 }
    );
}
