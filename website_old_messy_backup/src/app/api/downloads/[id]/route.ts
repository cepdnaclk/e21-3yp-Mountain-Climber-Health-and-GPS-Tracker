import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await Promise.resolve(context.params);

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: pkg, error } = await supabase
    .from("software_packages")
    .select("id, storage_path")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !pkg) {
    return NextResponse.json(
      {
        ok: false,
        message: "Download not allowed or package not found.",
      },
      { status: 403 }
    );
  }

  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from("product-files")
    .createSignedUrl(pkg.storage_path, 60);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: signedError?.message || "Could not create download link.",
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