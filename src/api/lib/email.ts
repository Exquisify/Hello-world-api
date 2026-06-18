export async function sendResetEmail(
  email: string,
  token: string,
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`Reset email stub for ${email}: ${token}`);
  }
}
