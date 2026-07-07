import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid login request" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const { success, remaining, reset } = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);

  if (!success) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in 15 minutes." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 401,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    );
  }

  // Check if user has MFA enabled
  const {
    data: { user: _user },
  } = await supabase.auth.getUser();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const mfaRequired = factors?.totp && factors.totp.length > 0;

  revalidatePath("/", "layout");

  return NextResponse.json(
    { success: true, mfaRequired },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
