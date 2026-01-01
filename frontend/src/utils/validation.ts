/**
 * Validates an email address using a regular expression.
 * @param email The email address to validate.
 * @returns True if the email is valid, false otherwise.
 */
export function validateEmail(email: string): boolean {
  // Regular expression for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password based on minimum length.
 * @param password The password to validate.
 * @param minLength The minimum required length (default: 6).
 * @returns True if the password is valid, false otherwise.
 */
export function validatePassword(password: string, minLength: number = 6): boolean {
  return password.length >= minLength;
}