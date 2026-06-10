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
    const requestId = String(body.request_id || "").trim();

    if (!requestId) {
      return NextResponse.json(
        { ok: false, message: "Request ID is required." },
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
        { ok: false, message: "Access request not found." },
        { status: 404 }
      );
    }

    if (!accessRequest.user_id && !accessRequest.email) {
      return NextResponse.json(
        { ok: false, message: "Request has no linked user or email." },
        { status: 400 }
      );
    }

    let accountQuery = supabaseAdmin
      .from("basecamp_accounts")
      .update({
        verification_status: "verified",
        updated_at: new Date().toISOString(),
      });

    if (accessRequest.user_id) {
      accountQuery = accountQuery.eq("id", accessRequest.user_id);
    } else {
      accountQuery = accountQuery.eq("email", accessRequest.email);
    }

    const { error: accountError } = await accountQuery;

    if (accountError) {
      return NextResponse.json(
        { ok: false, message: accountError.message },
        { status: 500 }
      );
    }

    const { error: requestUpdateError } = await supabaseAdmin
      .from("basecamp_access_requests")
      .update({
        status: "approved",
        admin_note: "Account approved. Portal access unlocked.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (requestUpdateError) {
      return NextResponse.json(
        { ok: false, message: requestUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Account approved for ${accessRequest.email}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to approve account.",
      },
      { status: 500 }
    );
  }
}