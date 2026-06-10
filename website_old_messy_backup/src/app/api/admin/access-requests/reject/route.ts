import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdminUser();

    if (!adminCheck.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: adminCheck.message,
        },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();

    const requestId = String(body.request_id || "").trim();
    const adminNote = String(body.admin_note || "Rejected by admin.").trim();

    if (!requestId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Request ID is required.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("basecamp_access_requests")
      .update({
        status: "rejected",
        admin_note: adminNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Request rejected.",
    });
  } catch (error) {
    console.error("Reject request error:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to reject request.",
      },
      { status: 500 }
    );
  }
}