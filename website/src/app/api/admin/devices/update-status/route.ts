import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const VALID_STATUSES = [
  "unassigned",
  "assigned",
  "active",
  "disabled",
  "lost",
] as const;

type DeviceStatus = (typeof VALID_STATUSES)[number];

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdminUser();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { ok: false, message: adminCheck.message },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();

    const deviceId = String(body.device_id || "").trim();
    const nextStatus = String(body.status || "").trim().toLowerCase();

    if (!deviceId) {
      return NextResponse.json(
        { ok: false, message: "Device ID is required." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(nextStatus as DeviceStatus)) {
      return NextResponse.json(
        { ok: false, message: "Invalid device status." },
        { status: 400 }
      );
    }

    const { data: device, error: deviceError } = await supabaseAdmin
      .from("devices")
      .select("id, device_uid, status, owner_id")
      .eq("id", deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json(
        { ok: false, message: "Device not found." },
        { status: 404 }
      );
    }

    if (
      (nextStatus === "assigned" || nextStatus === "active") &&
      !device.owner_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "This device has no owner. A customer must claim it before it can be assigned or active.",
        },
        { status: 400 }
      );
    }

    if (nextStatus === "unassigned") {
      const { error: updateError } = await supabaseAdmin
        .from("devices")
        .update({
          status: "unassigned",
          owner_id: null,
          basecamp_id: null,
          registered_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId);

      if (updateError) {
        return NextResponse.json(
          { ok: false, message: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `${device.device_uid} was unassigned and owner was cleared.`,
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("devices")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, message: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `${device.device_uid} status changed to ${nextStatus}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update device status.",
      },
      { status: 500 }
    );
  }
}