import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: "sb-aims-auth-token",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value, {
                // httpOnly must be false so browser client can read session cookie
                // https://supabase.com/docs/guides/auth/server-side/nextjs#making-the-session-available-to-the-client
                httpOnly: false,
                secure: true,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24,
              });
            });
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    },
  );
}
