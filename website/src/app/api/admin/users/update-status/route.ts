import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const VALID_STATUSES = ["pending", "verified", "suspended"] as const;

type VerificationStatus = (typeof VALID_STATUSES)[number];

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

    const userId = String(body.user_id || "").trim();
    const verificationStatus = String(
      body.verification_status || ""
    ).trim() as VerificationStatus;

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(verificationStatus)) {
      return NextResponse.json(
        { ok: false, message: "Invalid verification status." },
        { status: 400 }
      );
    }

    if (
      userId === adminCheck.user.id &&
      verificationStatus !== "verified"
    ) {
      return NextResponse.json(
        { ok: false, message: "You cannot suspend your own admin account." },
        { status: 400 }
      );
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("basecamp_accounts")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { ok: false, message: "User account not found." },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("basecamp_accounts")
      .update({
        verification_status: verificationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, message: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `${targetUser.email} status changed to ${verificationStatus}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update user status.",
      },
      { status: 500 }
    );
  }
}