"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Handles secure file downloads by generating temporary signed URLs for
 * authorized customer software packages.
 * 
 * @module DownloadActions
 */


export async function getDownloadUrl(packageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };
  // CRITICAL: Our RLS policy automatically ensures the query will return NO DATA
  // if the customer doesn't have an approved device for this product!
  const { data: pkg, error: fetchError } = await supabase
    .from("software_packages")
    .select("file_url, name, version")
    .eq("id", packageId)
    .single();

  if (fetchError || !pkg) {
    return { success: false, error: "Package not found or you don't have access to it." };
  }
  const { data: signedData, error: signError } = await supabase.storage
    .from("software_releases")
    .createSignedUrl(pkg.file_url, 3600, {
      download: `${pkg.name}_v${pkg.version}`.replace(/\s+/g, '_') // Suggest a filename for the download
    });

  if (signError || !signedData) {
    console.error("Signed URL error:", signError);
    return { success: false, error: "Failed to generate secure download link." };
  }

  return { success: true, signedUrl: signedData.signedUrl };
}
