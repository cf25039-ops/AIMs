"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Users } from "lucide-react";
import { AdminRoleManager } from "@/components/settings/admin-role-manager";
import { createClient } from "@/lib/supabase/client";

export default function UsersManagementPage() {
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return { user, profile };
    },
  });

  if (isLoading) {
    return (
      <FadeIn className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm">Loading...</p>
        </div>
      </FadeIn>
    );
  }

  if (!userProfile?.user) {
    return (
      <FadeIn className="flex items-center justify-center h-96">
        <p className="text-sm text-muted-foreground">Not authenticated.</p>
      </FadeIn>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <FadeIn className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">User Management</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage user accounts with role-based access
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <AdminRoleManager currentUserId={userProfile.user.id} />
      </FadeIn>
    </div>
  );
}
