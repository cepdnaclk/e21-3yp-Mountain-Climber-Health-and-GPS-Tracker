import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentAccountStatus() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      loggedIn: false as const,
      user: null,
      account: null,
      isVerified: false,
      status: null,
    };
  }

  const { data: account } = await supabase
    .from("basecamp_accounts")
    .select(
      "id, full_name, organization_name, email, role, verification_status"
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    loggedIn: true as const,
    user,
    account,
    isVerified: account?.verification_status === "verified",
    status: account?.verification_status || "pending",
  };
}