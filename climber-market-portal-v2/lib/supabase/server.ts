import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Initializes the Supabase client for use within Next.js Server Components.
 * Handles the reading and writing of authentication cookies in the server context.
 * 
 * @returns {Promise<SupabaseClient>} An authenticated Supabase client instance.
 */


// This creates a Supabase client that runs ON THE SERVER.
// Used inside Server Components, Server Actions, and Route Handlers.
// It reads cookies to know which user is logged in.

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component — ignore.
            // Cookies can only be set in Server Actions or Route Handlers.
          }
        },
      },
    }
  );
}
