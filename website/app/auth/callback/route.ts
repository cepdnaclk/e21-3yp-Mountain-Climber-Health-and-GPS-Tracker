import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This route handles the redirect after a user clicks the email
// confirmation link. Supabase sends them here with a "code" in the URL.
// We exchange that code for a session, then redirect to the homepage.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to login with an error
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
