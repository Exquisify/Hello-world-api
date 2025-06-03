import { NextRequest, NextResponse } from "next/server";
import { ideaSchema } from "@/lib/validators";
import { sanitizeHTML } from "@/lib/sanitizer";
import { prisma } from "@/lib/db";

/**
 * POST /api/ideas
 *  - Validates the incoming JSON body against ideaSchema.
 *  - Sanitizes the “content” field to strip malicious HTML.
 *  - Creates a new “idea” in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 1) Validate shape/types
    const parsed = ideaSchema.parse(body);

    // 2) Sanitize HTML content
    const cleanContent = sanitizeHTML(parsed.content);

    // 3) Insert into DB (using parameterized queries/ORM to prevent SQLi)
    const created = await prisma.idea.create({
      data: {
        title: parsed.title,
        content: cleanContent,
        tags: parsed.tags ?? [],
        authorId: /* get from session/auth context */,
      },
    });

    return NextResponse.json({ idea: created }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 422 }
      );
    }
    console.error("Unexpected error in POST /api/ideas:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ideas
 *  - Returns a list of all ideas (public endpoint)
 */
export async function GET() {
  try {
    const allIdeas = await prisma.idea.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ideas: allIdeas }, { status: 200 });
  } catch (err) {
    console.error("GET /api/ideas failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
