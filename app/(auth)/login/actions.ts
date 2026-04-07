"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, buildSessionValue } from "@/app/lib/auth";

type LoginResult = {
  ok: boolean;
  message?: string;
};

export async function loginAction(username: string, password: string): Promise<LoginResult> {
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();

  if (!normalizedUsername || !normalizedPassword) {
    return { ok: false, message: "Veuillez renseigner votre identifiant et votre mot de passe." };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: buildSessionValue(normalizedUsername),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return { ok: true };
}