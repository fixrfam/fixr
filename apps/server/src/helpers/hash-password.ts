import bcrypt from "bcrypt"

export async function hashPassword(password: string) {
  // Using rounds parameter directly is more efficient than generating salt separately
  return await bcrypt.hash(password, 10)
}
