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

    if (!requestId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Request ID is required.",
        },
        { status: 400 }
      );
    }

    const { data: accessRequest, error: requestError } = await supabaseAdmin
      .from("basecamp_access_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !accessRequest) {
      return NextResponse.json(
        {
          ok: false,
          message: "Access request not found.",
        },
        { status: 404 }
      );
    }

    if (accessRequest.status === "rejected") {
      return NextResponse.json(
        {
          ok: false,
          message: "Rejected requests cannot be invited.",
        },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(accessRequest.email, {
        redirectTo: `${siteUrl}/login`,
        data: {
          full_name: accessRequest.full_name,
          organization_name: accessRequest.organization_name,
          role: "basecamp_owner",
        },
      });

    if (inviteError) {
      console.error("Invite error:", inviteError);

      return NextResponse.json(
        {
          ok: false,
          message: inviteError.message,
        },
        { status: 500 }
      );
    }

    const invitedUserId = inviteData.user?.id;

    if (invitedUserId) {
      await supabaseAdmin.from("basecamp_accounts").upsert({
        id: invitedUserId,
        full_name: accessRequest.full_name || "Basecamp Owner",
        organization_name: accessRequest.organization_name,
        email: accessRequest.email,
        phone: accessRequest.phone,
        location: accessRequest.location,
        role: "basecamp_owner",
        verification_status: "verified",
        updated_at: new Date().toISOString(),
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("basecamp_access_requests")
      .update({
        status: "invited",
        admin_note: "Approved and invitation email sent.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          message: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Invitation sent to ${accessRequest.email}.`,
    });
  } catch (error) {
    console.error("Approve request error:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to approve request.",
      },
      { status: 500 }
    );
  }
}