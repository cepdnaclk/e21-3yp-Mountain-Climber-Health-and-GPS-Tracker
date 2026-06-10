import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Please login first." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const device_uid = String(body.device_uid || "").trim().toUpperCase();
  const claim_code = String(body.claim_code || "").trim().toUpperCase();

  const { data, error } = await supabase.rpc("claim_device", {
    p_device_uid: device_uid,
    p_claim_code: claim_code,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}