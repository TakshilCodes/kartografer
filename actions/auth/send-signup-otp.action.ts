"use server";

import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { z } from "zod";

import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import { getKartograferEmailLogoUrl } from "@/lib/auth/otp-email";

const resend = new Resend(process.env.RESEND_API_KEY);

const SendSignupOtpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

type SendSignupOtpInput = z.infer<typeof SendSignupOtpSchema>;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSignupOtpKey(email: string) {
  return `auth:signup-otp:${email}`;
}

function getSignupOtpRateLimitKey(email: string) {
  return `rate-limit:signup-otp:${email}`;
}

export async function sendSignupOtpAction(values: SendSignupOtpInput) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        ok: false,
        error: "Resend API key is missing.",
        message: null,
      };
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return {
        ok: false,
        error: "Resend from email is missing.",
        message: null,
      };
    }

    if (!process.env.RESEND_OTP_TEMPLATE_ID) {
      return {
        ok: false,
        error: "Resend OTP template ID is missing.",
        message: null,
      };
    }

    const parsed = SendSignupOtpSchema.safeParse(values);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.flatten().fieldErrors,
        message: null,
      };
    }

    const name = parsed.data.name.trim();
    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;

    const rateLimitKey = getSignupOtpRateLimitKey(email);
    const currentRequests = await redis.incr(rateLimitKey);

    if (currentRequests === 1) {
      await redis.expire(rateLimitKey, 10 * 60);
    }

    if (currentRequests > 3) {
      return {
        ok: false,
        error: "Too many OTP requests. Please try again after 10 minutes.",
        message: null,
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return {
        ok: false,
        error:
          "An account already exists with this email. Please sign in instead.",
        message: null,
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();

    await redis.set(
      getSignupOtpKey(email),
      JSON.stringify({
        name,
        email,
        hashedPassword,
        otp,
        attempts: 0,
        createdAt: new Date().toISOString(),
      }),
      "EX",
      10 * 60,
    );

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [email],
      subject: "Verify your Kartografer account",
      template: {
        id: process.env.RESEND_OTP_TEMPLATE_ID,
        variables: {
          userName: name,
          purpose: "create your Kartografer account",
          expiresInMinutes: "10",
          otp,
          logoUrl: getKartograferEmailLogoUrl(),
        },
      },
    });

    if (error) {
      console.error("RESEND_SIGNUP_OTP_ERROR", error);

      return {
        ok: false,
        error: "Could not send OTP email. Please try again.",
        message: null,
      };
    }

    return {
      ok: true,
      error: null,
      message: "OTP sent successfully. Please check your email.",
    };
  } catch (error) {
    console.error("SEND_SIGNUP_OTP_ERROR", error);

    return {
      ok: false,
      error: "Something went wrong. Please try again.",
      message: null,
    };
  }
}
