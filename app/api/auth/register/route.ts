import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passkeys } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";

/**
 * Registration request schema
 */
const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  timezone: z.string().optional().default("UTC"),
});

/**
 * POST /api/auth/register
 * 
 * Creates a new user account with a unique token
 * Returns the token for passkey creation
 * 
 * If email already exists but user has no passkey, allows re-registration
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user with this email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser) {
      // Check if user has any passkeys
      const [existingPasskey] = await db
        .select()
        .from(passkeys)
        .where(eq(passkeys.userId, existingUser.id))
        .limit(1);

      if (existingPasskey) {
        // User exists and has passkey - cannot re-register
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "EMAIL_ALREADY_EXISTS",
              message: "An account with this email already exists. Please login instead.",
            },
          },
          { status: 409 }
        );
      }

      // User exists but has no passkey - allow re-registration
      // Update user with new name and token
      const newToken = randomUUID();
      const [updatedUser] = await db
        .update(users)
        .set({
          name: validatedData.name,
          token: newToken,
          timezone: validatedData.timezone || "UTC",
        })
        .where(eq(users.id, existingUser.id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          token: users.token,
          timezone: users.timezone,
        });

      return NextResponse.json(
        {
          success: true,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            timezone: updatedUser.timezone,
          },
          token: updatedUser.token,
          message: "Account updated. Please create your passkey.",
        },
        { status: 200 }
      );
    }

    // Generate unique token
    const token = randomUUID();

    // Create new user in database
    const [newUser] = await db
      .insert(users)
      .values({
        name: validatedData.name,
        email: validatedData.email,
        token: token,
        timezone: validatedData.timezone || "UTC",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        token: users.token,
        timezone: users.timezone,
      });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          timezone: newUser.timezone,
        },
        token: newUser.token, // Return token for passkey creation
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    // Check for unique constraint violation (token collision - very unlikely)
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TOKEN_COLLISION",
            message: "Token collision occurred. Please try again.",
          },
        },
        { status: 500 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during registration",
        },
      },
      { status: 500 }
    );
  }
}
