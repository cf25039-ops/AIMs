import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: "sb-aims-auth-token",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      },
    },
  );
}
