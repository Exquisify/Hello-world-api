import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  username?: string
  isPremium: boolean
  walletAddress?: string
}
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value
    if (!token) return null
    const payload = verifyToken(token)
    if (!payload) return null
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        isPremium: true,
        walletAddress: true,
      },
    })
    return user
  } catch {
    return null
  }
}
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}
export async function requirePremium(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request)
  if (!user.isPremium) {
    throw new Error("Premium subscription required")
  }
  return user
}