"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

interface RoleContextValue {
  role: UserRole | null;
  profile: any | null;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  profile: null,
  isLoading: true,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRole() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select(
            "*, assigned_department:departments(id, name, facility:facilities(id, name, state:states(id, name)))"
          )
          .eq("id", user.id)
          .single();

        if (profileData) {
          setRole(profileData.role as UserRole);
          setProfile({ ...profileData, email: user.email });
        }
      } catch (err) {
        console.error("Failed to load role:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRole();
  }, []);

  return (
    <RoleContext.Provider value={{ role, profile, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
