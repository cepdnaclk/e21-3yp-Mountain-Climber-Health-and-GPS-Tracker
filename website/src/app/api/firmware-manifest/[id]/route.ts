import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ManifestPart = {
  path: string;
  offset: number;
};

type ManifestBuild = {
  chipFamily: string;
  parts: ManifestPart[];
};

type FirmwareManifest = {
  name: string;
  version: string;
  new_install_prompt_erase?: boolean;
  builds: ManifestBuild[];
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const packageId = params.id;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please login first." },
      { status: 401 }
    );
  }

  const { data: account } = await supabaseAdmin
    .from("basecamp_accounts")
    .select("verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (account?.verification_status !== "verified") {
    return NextResponse.json(
      { error: "Account approval required." },
      { status: 403 }
    );
  }

  const { data: pkg, error: packageError } = await supabaseAdmin
    .from("software_packages")
    .select(
      "id, title, required_device_type, install_supported, install_manifest_path, is_active"
    )
    .eq("id", packageId)
    .eq("is_active", true)
    .single();

  if (packageError || !pkg) {
    return NextResponse.json(
      { error: "Package not found." },
      { status: 404 }
    );
  }

  if (!pkg.install_supported || !pkg.install_manifest_path) {
    return NextResponse.json(
      { error: "This package does not support browser installation." },
      { status: 400 }
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
        { error: "Required registered device not found." },
        { status: 403 }
      );
    }
  }

  const { data: manifestSigned, error: manifestSignedError } =
    await supabaseAdmin.storage
      .from("product-files")
      .createSignedUrl(pkg.install_manifest_path, 60);

  if (manifestSignedError || !manifestSigned?.signedUrl) {
    return NextResponse.json(
      { error: "Manifest file not found in storage." },
      { status: 500 }
    );
  }

  const manifestResponse = await fetch(manifestSigned.signedUrl);

  if (!manifestResponse.ok) {
    return NextResponse.json(
      { error: "Failed to read manifest file." },
      { status: 500 }
    );
  }

  const manifest = (await manifestResponse.json()) as FirmwareManifest;

  const manifestDir = pkg.install_manifest_path
    .split("/")
    .slice(0, -1)
    .join("/");

  for (const build of manifest.builds) {
    for (const part of build.parts) {
      const partStoragePath = `${manifestDir}/${part.path}`;

      const { data: signedPart, error: signedPartError } =
        await supabaseAdmin.storage
          .from("product-files")
          .createSignedUrl(partStoragePath, 60);

      if (signedPartError || !signedPart?.signedUrl) {
        return NextResponse.json(
          { error: `Firmware file missing: ${partStoragePath}` },
          { status: 500 }
        );
      }

      part.path = signedPart.signedUrl;
    }
  }

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}