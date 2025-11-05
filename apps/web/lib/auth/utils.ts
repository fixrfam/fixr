import { cookieKey } from "@fixr/constants/cookies"
import { userJWT } from "@fixr/schemas/auth"
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import { parseCookies } from "nookies"
import { parseJwt } from "../utils"
import { axios } from "./axios"

export function emailDisplayName(email: string) {
  return email.split("@")[0]
}

export async function signOut(cookieString?: string) {
  return cookieString
    ? await axios.get("/auth/signout", { headers: { Cookie: cookieString } })
    : await axios.get("/auth/signout")
}

export function getSession(cookies?: ReadonlyRequestCookies) {
  if (cookies) {
    const jwt = parseJwt(cookies.get(cookieKey("session"))?.value)
    return userJWT.parse(jwt)
  }

  const cookieStore = parseCookies()
  const jwt = parseJwt(cookieStore[cookieKey("session")]) // Corrected access using cookieKey
  return userJWT.parse(jwt)
}

export const getClientSession = (): ReturnType<typeof userJWT.parse> | null => {
  const cookies = parseCookies()

  const raw = cookies[cookieKey("session")]
  if (!raw) return null

  try {
    const jwt = parseJwt(raw)
    return userJWT.parse(jwt)
  } catch {
    return null
  }
}
