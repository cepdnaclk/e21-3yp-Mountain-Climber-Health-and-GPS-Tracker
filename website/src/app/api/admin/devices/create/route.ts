import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const VALID_DEVICE_TYPES = ["climber", "basecamp", "repeater"] as const;

function generateClaimCode(deviceType: string) {
  const prefix =
    deviceType === "climber" ? "CL" : deviceType === "basecamp" ? "BC" : "RP";

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);

  let code = "";

  for (let i = 0; i < bytes.length; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }

  return `${prefix}-${code}`;
}

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

    const deviceType = String(body.device_type || "").trim().toLowerCase();
    const hardwareVersion = String(body.hardware_version || "HW-1.0").trim();
    const firmwareVersion = String(body.firmware_version || "FW-1.0.0").trim();
    const serialNumber = String(body.serial_number || "").trim();

    if (!VALID_DEVICE_TYPES.includes(deviceType as any)) {
      return NextResponse.json(
        { ok: false, message: "Invalid device type." },
        { status: 400 }
      );
    }

    const { data: generatedUid, error: uidError } = await supabaseAdmin.rpc(
      "generate_device_uid",
      {
        p_device_type: deviceType,
      }
    );

    if (uidError || !generatedUid) {
      return NextResponse.json(
        {
          ok: false,
          message: uidError?.message || "Failed to generate device UID.",
        },
        { status: 500 }
      );
    }

    const claimCode = generateClaimCode(deviceType);

    const { data: createdDevice, error: createError } =
      await supabaseAdmin.rpc("factory_create_device", {
        p_device_uid: generatedUid,
        p_device_type: deviceType,
        p_claim_code: claimCode,
        p_hardware_version: hardwareVersion,
        p_firmware_version: firmwareVersion,
        p_serial_number: serialNumber || null,
      });

    if (createError || !createdDevice?.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            createError?.message ||
            createdDevice?.message ||
            "Failed to create device.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Device created successfully.",
      device_uid: generatedUid,
      claim_code: claimCode,
      device_type: deviceType,
      hardware_version: hardwareVersion,
      firmware_version: firmwareVersion,
      serial_number: serialNumber || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to create device.",
      },
      { status: 500 }
    );
  }
}