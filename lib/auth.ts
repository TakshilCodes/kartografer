import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";
import {
  clearLoginEmailLimit,
  consumeLoginAttempt,
} from "@/lib/rate-limit/login-rate-limit";
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials, req) {
        const attemptedEmail =
          typeof credentials?.email === "string" ? credentials.email : "";

        const rateLimit = await consumeLoginAttempt({
          email: attemptedEmail,
          headers: req.headers,
        });

        if (!rateLimit.allowed) {
          throw new Error("LOGIN_RATE_LIMITED:" + rateLimit.retryAfterSeconds);
        }

        const parsed = LoginSchema.safeParse(credentials);

        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) return null;

        if (!user.hashedPassword) {
          throw new Error(
            "This account was created with Google. Please continue with Google.",
          );
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in.");
        }

        const isPasswordValid = await bcrypt.compare(
          parsed.data.password,
          user.hashedPassword,
        );

        if (!isPasswordValid) return null;

        await clearLoginEmailLimit(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !account.providerAccountId) {
        return true;
      }

      const linkedAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      const googleEmail = profile?.email?.toLowerCase().trim();
      const currentEmail = linkedAccount?.user.email?.toLowerCase().trim();

      if (linkedAccount && googleEmail && currentEmail !== googleEmail) {
        await prisma.account.delete({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        return "/signin?error=GoogleAccountReadyForSignup";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
