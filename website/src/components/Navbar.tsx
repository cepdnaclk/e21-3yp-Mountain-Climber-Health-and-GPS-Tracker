import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function Navbar() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: adminRow } = await supabaseAdmin
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    isAdmin = Boolean(adminRow);
  }

  return (
    <header className="border-b border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-400 font-black text-slate-950">
            MS
          </div>

          <div>
            <div className="text-xl font-black">MountainSafety</div>
            <div className="text-sm text-slate-400">LoRa Rescue System</div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-300">
          {!user && (
            <>
              <Link href="/register" className="hover:text-emerald-300">
                Request Access
              </Link>

              <Link href="/login" className="hover:text-emerald-300">
                Login
              </Link>
            </>
          )}

          {user && (
            <>
              <Link href="/portal" className="hover:text-emerald-300">
                Portal
              </Link>

              {isAdmin && (
                <Link href="/admin" className="hover:text-emerald-300">
                  Admin
                </Link>
              )}

              <a
                href="/logout"
                className="rounded-lg border border-white/15 px-4 py-2 hover:bg-white/10"
              >
                Logout
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}