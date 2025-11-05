import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function api(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`
}

export function parseJwt(token?: string) {
  if (!token) return null

  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const raw = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    const json = new TextDecoder('utf-8').decode(raw)

    return JSON.parse(json)
  } catch {
    return null
  }
}

export const isClientSide = (): boolean => typeof window !== 'undefined'

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]: Required<Pick<T, K>> & Partial<Omit<T, K>>
}[Keys]

export function firstUpper(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

type Success<T> = {
  data: T
  error: null
}

type Failure<E> = {
  data: null
  error: E
}

type Result<T, E = Error> = Success<T> | Failure<E>

// Main wrapper function
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as E }
  }
}
