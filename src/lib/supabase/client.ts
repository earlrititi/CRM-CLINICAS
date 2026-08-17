import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createClient() {
  const { publishableKey, url } = getSupabaseConfig();

  return createBrowserClient<Database>(url, publishableKey);
}
