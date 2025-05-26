import { cookieKey } from "@fixr/constants/cookies";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();

    cookieStore.delete(cookieKey("session"));
    cookieStore.delete(cookieKey("refreshToken"));

    return NextResponse.redirect(new URL("/auth/login", request.url));
}
