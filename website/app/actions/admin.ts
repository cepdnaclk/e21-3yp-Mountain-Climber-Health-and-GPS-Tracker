"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Administrative server actions for managing orders, devices, and registrations.
 * Requires an active session with administrator privileges.
 * 
 * @module AdminActions
 */


export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: "Failed to update order" };
  }
  const { error: logError } = await supabase.from("admin_logs").insert({
    admin_id: user.id,
    action: `Changed order status to ${newStatus}`,
    target_type: "order",
    target_id: orderId,
  });

  if (logError) {
    console.error("Failed to insert admin log:", logError);
  }
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function addDeviceStock(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  const productId = formData.get("productId") as string;
  const serialNumber = formData.get("serialNumber") as string;
  const batchId = formData.get("batchId") as string;

  if (!productId || !serialNumber) {
    return { success: false, error: "Product and Serial Number are required." };
  }
  const { error } = await supabase.from("devices").insert({
    product_id: productId,
    serial_number: serialNumber.trim(),
    batch_id: batchId ? batchId.trim() : null,
    status: "available",
  });

  if (error) {
    console.error("Failed to add device:", error);
    // Handle unique constraint violation on serial_number
    if (error.code === '23505') {
      return { success: false, error: "This serial number already exists in the system." };
    }
    return { success: false, error: "Failed to add device. Please check the logs." };
  }
  await supabase.from("admin_logs").insert({
    admin_id: user.id,
    action: `Added new device stock: ${serialNumber}`,
    target_type: "device",
  });

  revalidatePath("/admin/devices");
  return { success: true };
}

export async function recordSoftwarePackage(data: {
  productId: string;
  name: string;
  version: string;
  description: string;
  fileUrl: string;
  fileSizeBytes: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { success: false, error: "Unauthorized" };
  const { error } = await supabase.from("software_packages").insert({
    product_id: data.productId,
    name: data.name,
    version: data.version,
    description: data.description,
    file_url: data.fileUrl,
    file_size_bytes: data.fileSizeBytes,
    is_active: true
  });

  if (error) {
    console.error("Failed to save software package metadata:", error);
    return { success: false, error: "Failed to save metadata to database" };
  }
  await supabase.from("admin_logs").insert({
    admin_id: user.id,
    action: `Uploaded software package ${data.name} v${data.version}`,
    target_type: "software",
  });

  revalidatePath("/admin/software");
  return { success: true };
}

export async function approveRegistration(regId: string, deviceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { success: false, error: "Unauthorized" };
  const { error: regError } = await supabase
    .from("device_registrations")
    .update({ approved_by_admin: true })
    .eq("id", regId);

  if (regError) {
    console.error("Failed to approve registration:", regError);
    return { success: false, error: "Failed to approve registration" };
  }
  const { error: devError } = await supabase
    .from("devices")
    .update({ status: "registered" })
    .eq("id", deviceId);

  if (devError) {
    console.error("Failed to update device status:", devError);
  }
  await supabase.from("admin_logs").insert({
    admin_id: user.id,
    action: `Approved device registration ${regId}`,
    target_type: "registration",
    target_id: regId
  });

  revalidatePath("/admin/registrations");
  revalidatePath("/my-devices");
  return { success: true };
}

export async function rejectRegistration(regId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { success: false, error: "Unauthorized" };
  const { error: regError } = await supabase
    .from("device_registrations")
    .delete()
    .eq("id", regId);

  if (regError) {
    console.error("Failed to reject registration:", regError);
    return { success: false, error: "Failed to reject registration" };
  }
  await supabase.from("admin_logs").insert({
    admin_id: user.id,
    action: `Rejected device registration ${regId}`,
    target_type: "registration",
    target_id: regId
  });

  revalidatePath("/admin/registrations");
  revalidatePath("/my-devices");
  return { success: true };
}
