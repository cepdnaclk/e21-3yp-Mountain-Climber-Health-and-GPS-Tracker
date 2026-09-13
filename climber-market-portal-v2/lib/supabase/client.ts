import { createBrowserClient } from "@supabase/ssr";

// This creates a Supabase client that runs IN THE BROWSER.
// Used inside components marked with "use client".

/**
 * Initializes the Supabase client for use within React Client Components.
 * Utilizes the @supabase/ssr package to manage browser cookies securely.
 * 
 * @returns {SupabaseClient} An authenticated Supabase client instance.
 */

// It uses the anon key, so all queries go through RLS policies.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
