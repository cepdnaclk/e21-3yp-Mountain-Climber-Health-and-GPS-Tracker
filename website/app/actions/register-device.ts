"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Manages the hardware registration workflow, verifying device serial numbers
 * and assigning ownership to the authenticated user.
 * 
 * @module DeviceRegistration
 */


export async function registerDevice(serialNumber: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in to register a device." };
  }

  if (!serialNumber || serialNumber.trim() === "") {
    return { success: false, error: "Please enter a valid serial number." };
  }
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("*")
    .eq("serial_number", serialNumber.trim())
    .single();

  if (deviceError || !device) {
    return { success: false, error: "Invalid serial number. Device not found." };
  }
  if (device.status === "registered") {
    return { success: false, error: "This device is already registered." };
  }
  const { data: existingReg } = await supabase
    .from("device_registrations")
    .select("id")
    .eq("device_id", device.id)
    .single();

  if (existingReg) {
    return { success: false, error: "This device is already registered to an account." };
  }
  const { error: regError } = await supabase
    .from("device_registrations")
    .insert({
      user_id: user.id,
      device_id: device.id,
      // approved_by_admin is handled by the database default
    });

  if (regError) {
    console.error("Registration error:", regError);
    return { success: false, error: "Failed to register device. Please try again." };
  }

  // Note: Normally we'd also update the devices table status to 'registered'.
  // However, since we are doing this purely from the client's perspective, 
  // we would need admin privileges or a secure Postgres function to update the 
  // devices table. For now, the existence of the row in device_registrations is 
  // our source of truth, and admin approval will fully finalize it later.

  revalidatePath("/register");

  return { success: true };
}
