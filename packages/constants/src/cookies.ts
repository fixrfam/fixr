import { APP_NAME } from './app'

/**
 * Generates a standardized cookie key using the app's name.
 *
 * The format follows: `__${cookieName}__${appName}`.
 * This ensures consistency and prevents naming conflicts.
 *
 * @param name - The specific cookie name.
 * @returns A formatted cookie key in the form `__cookieName__appName`.
 */
export const cookieKey = (name: string): `__${typeof name}__${string}` => {
  const sanitizedAppName = APP_NAME.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')

  return `__${name}__${sanitizedAppName}`
}
