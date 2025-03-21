import {
    getEmployeeByCpf,
    getCompanyByCnpj,
    getUserByEmail,
    getCompanyBySubdomain,
    createOrgWithAdmin,
} from "@/lib/services/companies";
import { apiResponse, tryCatch } from "@/lib/utils";
import { unmask } from "@repo/constants/masks";
import { createCompanySchema } from "@repo/schemas/companies";
import { NextRequest, NextResponse } from "next/server";

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
