/**
 * Generate a random password of a given length
 *
 * @param length Password length
 * @returns
 */
export const generateRandomPassword = (length = 12): string => {
  if (length < 8 || length > 128) {
    throw new Error("Password length must be between 8 and 128 characters.")
  }

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const numbers = "0123456789"
  const special = "#?!@$%^&*-"
  const all = uppercase + lowercase + numbers + special

  const getRandomChar = (charset: string) =>
    charset[Math.floor(Math.random() * charset.length)] || ""

  let password =
    getRandomChar(uppercase) +
    getRandomChar(lowercase) +
    getRandomChar(numbers) +
    getRandomChar(special)

  for (let i = password.length; i < length; i++) {
    password += getRandomChar(all)
  }

  /* Shuffle the password to avoid predictable patterns */
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}
