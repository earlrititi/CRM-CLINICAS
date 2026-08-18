import { redirect } from "next/navigation";

import { canBypassAuthForLocalDevelopment, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type CurrentAccount = {
  email: string;
  isDevelopmentBypass: boolean;
  isSupabaseConfigured: boolean;
};

export async function getCurrentAccount(): Promise<CurrentAccount> {
  if (!isSupabaseConfigured) {
    if (canBypassAuthForLocalDevelopment) {
      return {
        email: "Sesion pendiente",
        isDevelopmentBypass: true,
        isSupabaseConfigured: false,
      };
    }

    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims) {
    redirect("/login");
  }

  return {
    email: typeof claims.email === "string" ? claims.email : "Sesion activa",
    isDevelopmentBypass: false,
    isSupabaseConfigured: true,
  };
}
