import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const providers: NextAuthConfig["providers"] = [
  CredentialsProvider({
    name: "Token",
    credentials: {
      token: { type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.token) return null;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.token, credentials.token as string))
        .limit(1);
      
      if (!user) return null;
      
      return {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      };
    },
  }),
];

// Only add EmailProvider if EMAIL_SERVER is configured
// In development, Mailpit is used automatically if EMAIL_SERVER is not set
if (env.EMAIL_SERVER) {
  providers.push(
    EmailProvider({
      server: env.EMAIL_SERVER,
      from: env.EMAIL_FROM,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  secret: env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token, user }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = user?.id?.toString() || token.sub || "";
      }
      return session;
    },
    async jwt({ token, user }) {
      // Add user ID to token
      if (user) {
        token.sub = user.id.toString();
      }
      return token;
    },
  },
});

export const { GET, POST } = handlers;