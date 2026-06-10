import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const full_name = String(body.full_name || "").trim();
    const organization_name = String(body.organization_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const phone = String(body.phone || "").trim();
    const location = String(body.location || "").trim();
    const expected_device_count = Number(body.expected_device_count || 1);
    const reason = String(body.reason || "").trim();

    if (!full_name || !organization_name || !email || !password || !location || !reason) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Full name, organization, email, password, location, and reason are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          organization_name,
          role: "basecamp_owner",
        },
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          ok: false,
          message:
            createUserError?.message ||
            "Could not create user account. The email may already be registered.",
        },
        { status: 400 }
      );
    }

    const userId = createdUser.user.id;

    const { error: accountError } = await supabaseAdmin
      .from("basecamp_accounts")
      .upsert({
        id: userId,
        full_name,
        organization_name,
        email,
        phone,
        location,
        role: "basecamp_owner",
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      });

    if (accountError) {
      return NextResponse.json(
        {
          ok: false,
          message: accountError.message,
        },
        { status: 500 }
      );
    }

    const { error: requestError } = await supabaseAdmin
      .from("basecamp_access_requests")
      .insert({
        user_id: userId,
        full_name,
        organization_name,
        email,
        phone,
        location,
        expected_device_count,
        reason,
        status: "pending",
      });

    if (requestError) {
      return NextResponse.json(
        {
          ok: false,
          message: requestError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Account created successfully. Your account is pending admin approval. You can login now, but device registration and downloads will unlock after approval.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Invalid request body.",
      },
      { status: 500 }
    );
  }
}