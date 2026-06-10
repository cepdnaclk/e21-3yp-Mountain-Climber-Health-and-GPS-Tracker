import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    if (userId === adminCheck.user.id) {
      return NextResponse.json(
        { ok: false, message: "You cannot remove your own admin account." },
        { status: 400 }
      );
    }

    const { data: adminRow } = await supabaseAdmin
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminRow) {
      return NextResponse.json(
        { ok: false, message: "Admin accounts cannot be removed here." },
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

    await supabaseAdmin
      .from("devices")
      .update({
        owner_id: null,
        basecamp_id: null,
        status: "unassigned",
        registered_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("owner_id", userId);

    await supabaseAdmin
      .from("download_logs")
      .delete()
      .eq("user_id", userId);

    await supabaseAdmin
      .from("support_tickets")
      .delete()
      .eq("owner_id", userId);

    await supabaseAdmin
      .from("basecamps")
      .delete()
      .eq("owner_id", userId);

    await supabaseAdmin
      .from("basecamp_access_requests")
      .update({
        user_id: null,
        status: "rejected",
        admin_note: "User account removed by admin.",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    await supabaseAdmin
      .from("basecamp_accounts")
      .delete()
      .eq("id", userId);

    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Public account data was removed, but Auth user deletion failed: " +
            deleteAuthError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `${targetUser.email} was removed. Owned devices were unassigned.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to remove user.",
      },
      { status: 500 }
    );
  }
}