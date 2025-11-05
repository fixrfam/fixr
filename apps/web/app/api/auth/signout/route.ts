import { cookieKey } from "@fixr/constants/cookies"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()

  cookieStore.delete(cookieKey("session"))
  cookieStore.delete(cookieKey("refreshToken"))

  return NextResponse.redirect(
    new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL),
  )
}
