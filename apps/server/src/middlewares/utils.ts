interface FastifyErrorLike extends Error {
  code: string
  name: string
  statusCode?: number
}

export function isFastifyError(err: unknown): err is FastifyErrorLike {
  if (typeof err !== "object" || err === null) return false
  const errorObj = err as Record<string, unknown>
  return typeof errorObj.code === "string" && typeof errorObj.name === "string"
}
