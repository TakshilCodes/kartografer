"use server";

import { z } from "zod";
import { signIn } from "next-auth/react";

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInInput = z.infer<typeof SignInSchema>;

export async function signInAction(values: SignInInput) {
  const parsed = SignInSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten().fieldErrors,
      message: null,
    };
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });

    return {
      ok: true,
      error: null,
      message: "Signed in successfully.",
    };
  } catch (error) {
    console.error("SIGN_IN_ACTION_ERROR", error);

    return {
      ok: false,
      error: "Invalid email or password.",
      message: null,
    };
  }
}
