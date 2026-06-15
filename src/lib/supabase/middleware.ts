import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Role-based access control map
const ROLE_ACCESS_MAP: Record<string, string[]> = {
  // Admin-only routes
  "/settings/users": ["super_admin", "admin"],
  "/settings/catalog": ["super_admin", "admin", "project_manager", "project_admin"],
  "/audit": ["super_admin", "admin", "project_manager"],

  // Project management routes
  "/projects": ["super_admin", "admin", "project_manager", "project_admin"],
  "/contracts": ["super_admin", "admin", "project_manager", "project_admin"],

  // Operations routes
  "/maintenance": ["super_admin", "admin", "project_manager", "project_admin", "technician", "department_user", "staff", "viewer"],
  "/assets": ["super_admin", "admin", "project_manager", "project_admin", "technician"],

  // Inventory routes
  "/vendors": ["super_admin", "admin", "project_manager"],
  "/warehouse": ["super_admin", "admin", "project_manager", "project_admin"],

  // Analytics routes
  "/reports": ["super_admin", "admin", "project_manager", "project_admin"],
  "/intelligence": ["super_admin", "admin", "project_manager"],

  // User-facing routes (all authenticated users)
  "/dashboard": ["super_admin", "admin", "project_manager", "project_admin", "technician", "department_user", "staff", "viewer"],
  "/settings": ["super_admin", "admin", "project_manager", "project_admin", "technician", "department_user", "staff", "viewer"],
  "/help": ["super_admin", "admin", "project_manager", "project_admin", "technician", "department_user", "staff", "viewer"],
  "/notifications": ["super_admin", "admin", "project_manager", "project_admin", "technician", "department_user", "staff", "viewer"],
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
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
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: false,
              secure: true,
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24,
            })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public paths that bypass authentication check
  const PUBLIC_PATHS = [
    "/login",
    "/api/auth/login",
    "/privacy",
    "/terms",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ];
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      const pathname = request.nextUrl.pathname;

      // Find the most specific route that matches
      const routeKey = Object.keys(ROLE_ACCESS_MAP).find((key) =>
        pathname.startsWith(key)
      );

      if (routeKey) {
        const allowedRoles = ROLE_ACCESS_MAP[routeKey];
        if (!allowedRoles.includes(profile.role)) {
          // Redirect to dashboard with error message
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          url.searchParams.set("error", "forbidden");
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}
