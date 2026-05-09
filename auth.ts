import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import PostgresAdapter from "@auth/pg-adapter";
import { getDbPool } from "@/lib/db/client";

if (process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.AUTH_URL;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NEXT_PHASE === "phase-production-build") {
    return "build-time-placeholder-secret";
  }
  if (!secret) throw new Error("Missing AUTH_SECRET environment variable");
  return secret;
}

function getEmailServerPort() {
  const raw = process.env.EMAIL_SERVER_PORT ?? "587";
  const port = Number.parseInt(raw, 10);
  if (Number.isNaN(port)) throw new Error("Invalid EMAIL_SERVER_PORT");
  return port;
}

export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(getDbPool()) as NextAuthOptions["adapter"],
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: getEmailServerPort(),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 15 * 60,
    }),
  ],
  pages: {
    signIn: "/settings",
    verifyRequest: "/settings",
  },
  secret: getAuthSecret(),
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
