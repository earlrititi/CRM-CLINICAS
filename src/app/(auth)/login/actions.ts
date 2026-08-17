"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";

import { getSafeNextPath } from "@/lib/auth/redirects";
import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { loginRequestSchema } from "@/lib/validation/auth";

function buildLoginPath(params: { error?: string; next?: string; sent?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.next) {
    searchParams.set("next", params.next);
  }

  if (params.sent) {
    searchParams.set("sent", params.sent);
  }

  const query = searchParams.toString();
  return (query ? `/login?${query}` : "/login") as Route;
}

export async function requestLoginLink(formData: FormData) {
  const next = getSafeNextPath(formData.get("next"));
  const parsed = loginRequestSchema.safeParse({
    email: formData.get("email"),
    next,
  });

  if (!parsed.success) {
    redirect(buildLoginPath({ error: "invalid_email", next }));
  }

  if (!isSupabaseConfigured) {
    redirect(buildLoginPath({ error: "supabase_not_configured", next }));
  }

  const supabase = await createClient();
  const redirectTo = `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    redirect(buildLoginPath({ error: "auth_request_failed", next }));
  }

  redirect(buildLoginPath({ next, sent: "1" }));
}
