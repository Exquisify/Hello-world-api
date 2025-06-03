import { NextRequest, NextResponse } from "next/server";
import { userProfileSchema } from "@/lib/validators";
import { sanitizeHTML, escapeText } from "@/lib/sanitizer";
import { prisma } from "@/lib/db";

interface Params {
  params: { id: string };
}

/**
 * PATCH /api/users/[id]
 *  - Allows updating a user’s profile fields: displayName, bio, website.
 *  - We’ll sanitize “bio” as HTML (in case the user wants limited formatting).
 *  - displayName and website get validated via Zod.
 */
export async function PATCH(
  request: NextRequest,
  { params }: Params
) {
  try {
    const userId = parseInt(params.id, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = userProfileSchema.parse(body);

    // 1) Sanitize “bio” (allow a small set of HTML tags)
    const cleanBio = parsed.bio ? sanitizeHTML(parsed.bio) : null;
    // 2) Escape displayName (just in case)
    const safeDisplayName = escapeText(parsed.displayName);

    // 3) Update in DB (parameterized)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: safeDisplayName,
        bio: cleanBio,
        website: parsed.website ?? null,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 422 }
      );
    }
    console.error(`Error in PATCH /api/users/${params.id}:`, err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/[id]
 *  - Returns user profile data (bio is already sanitized on write)
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const userId = parseInt(params.id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        website: true,
        // …any other public fields
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error(`GET /api/users/${params.id} failed:`, err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
