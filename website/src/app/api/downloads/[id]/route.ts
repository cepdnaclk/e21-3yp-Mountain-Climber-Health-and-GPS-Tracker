import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: account } = await supabaseAdmin
    .from("basecamp_accounts")
    .select("verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (account?.verification_status !== "verified") {
    return NextResponse.json(
      { ok: false, message: "Account approval required." },
      { status: 403 }
    );
  }

  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from("software_packages")
    .select(
      "id, title, storage_path, required_device_type, is_active"
    )
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (pkgError || !pkg) {
    return NextResponse.json(
      { ok: false, message: "Package not found." },
      { status: 404 }
    );
  }

  if (pkg.required_device_type !== "any") {
    const { data: matchingDevice } = await supabaseAdmin
      .from("devices")
      .select("id")
      .eq("owner_id", user.id)
      .eq("device_type", pkg.required_device_type)
      .in("status", ["assigned", "active"])
      .limit(1)
      .maybeSingle();

    if (!matchingDevice) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "You do not have the required registered device for this download.",
        },
        { status: 403 }
      );
    }
  }

  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from("product-files")
    .createSignedUrl(pkg.storage_path, 60);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json(
      {
        ok: false,
        message:
          signedError?.message ||
          "File not uploaded yet. Please contact support.",
      },
      { status: 500 }
    );
  }

  await supabaseAdmin.from("download_logs").insert({
    user_id: user.id,
    package_id: pkg.id,
  });

  return NextResponse.redirect(signed.signedUrl);
}