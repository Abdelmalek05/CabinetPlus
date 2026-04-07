"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth";

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}