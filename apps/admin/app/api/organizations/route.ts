import {
    getEmployeeByCpf,
    getOrganizationByCnpj,
    getUserByEmail,
    getOrganizationBySubdomain,
    createOrgWithAdmin,
} from "@/lib/services/organizations";
import { apiResponse, tryCatch } from "@/lib/utils";
import { unmask } from "@repo/constants/masks";
import { createOrganizationSchema } from "@repo/schemas/organizations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { data, error } = await tryCatch(createOrganizationSchema.parseAsync(await req.json()));

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

    const [existingEmployee, existingOrganization, existingEmail, existingSubdomain] =
        await Promise.all([
            getEmployeeByCpf(formatted.owner_cpf),
            getOrganizationByCnpj(formatted.cnpj),
            getUserByEmail(formatted.owner_email),
            getOrganizationBySubdomain(formatted.subdomain),
        ]);

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

    if (existingOrganization)
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

    return NextResponse.json(
        apiResponse({
            status: 201,
            error: null,
            code: "organization_create_success",
            message: "Organization created successfully.",
            data: null,
        }),
        { status: 201 }
    );
}
