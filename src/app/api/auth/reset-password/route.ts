import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/'; // Adjust based on your setup
import { sendResetEmail } from '@/lib/email'; // Stub function or real implementation
import crypto from 'crypto';
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'If user exists, a reset link will be sent.' }, { status: 200 });
    }
    // Generate token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    // Save token to DB
    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token, expires },
      create: { userId: user.id, token, expires },
    });
    // Send email (stub)
    await sendResetEmail(email, token);
    return NextResponse.json({ message: 'Password reset email sent.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
