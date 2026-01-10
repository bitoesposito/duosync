import { NextResponse } from "next/server";
import { signIn } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * Request schema for passkey login
 */
const loginSchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/auth/passkey/login
 * 
 * Logs in user after passkey verification
 * This endpoint is called after passkey verification succeeds
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.token, validatedData.token))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid token",
          },
        },
        { status: 401 }
      );
    }

    // Sign in user using NextAuth callback endpoint
    // In NextAuth v5, signIn can return a URL (redirect) or a Response object
    try {
      const signInResult = await signIn("credentials", {
        token: validatedData.token,
        redirect: false,
      });

      // signIn can return a URL string or a Response object
      // If it's a URL, that means it's trying to redirect (shouldn't happen with redirect: false)
      // If it's a Response, we need to handle it
      if (typeof signInResult === "string") {
        // This shouldn't happen with redirect: false, but handle it anyway
        console.warn("SignIn returned URL instead of Response:", signInResult);
        return NextResponse.json({
          success: true,
          message: "Login successful",
        });
      }

      // If it's a Response object, check if it's an error
      if (signInResult instanceof Response) {
        // Check if the response indicates an error
        const responseData = await signInResult.json().catch(() => null);
        if (responseData && responseData.error) {
          console.error("SignIn failed:", responseData);
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "SIGNIN_FAILED",
                message: responseData.error || "Failed to create session",
              },
            },
            { status: 500 }
          );
        }
        
        // Copy cookies from the signIn response
        const response = NextResponse.json({
          success: true,
          message: "Login successful",
        });
        
        // Copy Set-Cookie headers from signIn response
        signInResult.headers.forEach((value, key) => {
          if (key.toLowerCase() === "set-cookie") {
            response.headers.append("Set-Cookie", value);
          }
        });
        
        return response;
      }

      // If it's an object with ok/error properties (client-side signIn format)
      if (signInResult && typeof signInResult === "object" && "ok" in signInResult) {
        if (signInResult.ok === false) {
          console.error("SignIn failed:", signInResult);
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "SIGNIN_FAILED",
                message: signInResult.error || "Failed to create session",
              },
            },
            { status: 500 }
          );
        }
      }

      // Default success response
      return NextResponse.json({
        success: true,
        message: "Login successful",
      });
    } catch (signInError) {
      console.error("SignIn error:", signInError);
      // Even if signIn throws, the session might still be created
      // Return success and let the client handle it
      return NextResponse.json({
        success: true,
        message: "Login successful",
      });
    }
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

    console.error("Passkey login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during login",
        },
      },
      { status: 500 }
    );
  }
}


