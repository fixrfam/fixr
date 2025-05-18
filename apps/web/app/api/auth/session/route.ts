import { parseJwt } from "@/lib/utils";
import { cookieKey } from "@fixr/constants/cookies";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const cookieStore = await cookies();

    const jwt = parseJwt(cookieStore.get(cookieKey("session"))?.value);
    return NextResponse.json(jwt);
}
