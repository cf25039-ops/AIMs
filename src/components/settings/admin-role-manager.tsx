"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Search, ShieldCheck, Users, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRole } from "@/contexts/role-context";
import type { UserRole } from "@/types";
import { getRoleBadgeColor, getRoleLabel } from "@/utils/role";
import { createUserAccount, getAllUsers, updateUserRole } from "@/app/actions/admin";
import { validatePassword } from "@/lib/password-policy";
import toast from "react-hot-toast";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

const assignableRoles: Array<{ value: UserRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "project_admin", label: "Project Admin" },
  { value: "technician", label: "Technician" },
  { value: "department_user", label: "Department User" },
  { value: "viewer", label: "Viewer" },
  { value: "staff", label: "Staff" },
];

export function AdminRoleManager({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "department_user",
  });
  const [createError, setCreateError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { role } = useRole();
  const isSuperAdmin = role === "super_admin";

  const {
    data: safeProfiles = [],
    isLoading,
    refetch,
  } = useQuery<ProfileRow[]>({
    queryKey: ["admin-role-profiles"],
    queryFn: getAllUsers,
  });

  const profiles = safeProfiles;

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter((profile) => {
      const haystack = [profile.full_name, profile.email, profile.role, getRoleLabel(profile.role)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [profiles, searchQuery]);

  async function handleUpdateRole(profile: ProfileRow, newRole: UserRole) {
    if (profile.id === currentUserId || profile.role === "super_admin") return;
    setUpdatingId(profile.id);
    try {
      await updateUserRole(profile.id, newRole);
      await refetch();
    } catch (error: any) {
      toast.error(`Failed to update role: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");

    const pwErrors = validatePassword(createForm.password);
    if (pwErrors.length > 0) {
      setPasswordErrors(pwErrors);
      setCreateError("Please fix password requirements");
      return;
    }

    setCreateLoading(true);
    try {
      setCreateError("");
      setErrorMsg("");
      const result = await createUserAccount(createForm);
      if (result.success) {
        setShowCreateForm(false);
        setCreateForm({ email: "", password: "", fullName: "", role: "department_user" });
        queryClient.invalidateQueries({ queryKey: ["admin-role-profiles"] });
        setSuccessMsg("User created successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (error: any) {
      setCreateError(error.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Admin Role Assignment
        </CardTitle>
        <CardDescription>
          Manage user accounts and roles. Super admin accounts are protected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success/Error Feedback */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="ml-auto">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
            <X className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="ml-auto">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Create User Form */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users..."
              className="pl-9"
            />
          </div>
          {isSuperAdmin && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="gap-1.5 text-xs"
            >
              {showCreateForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showCreateForm ? "Cancel" : "Create User"}
            </Button>
          )}
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateUser}
            className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
          >
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5 text-primary" />
              Create New User Account
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Email
                </label>
                <Input
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="user@example.com"
                  type="email"
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <Input
                  value={createForm.password}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, password: e.target.value });
                    if (e.target.value.length > 0) {
                      setPasswordErrors(validatePassword(e.target.value));
                    } else {
                      setPasswordErrors([]);
                    }
                  }}
                  placeholder="Min 12 chars, mixed case + number + symbol"
                  type="password"
                  required
                  minLength={12}
                  className="h-9 text-sm"
                />
                {passwordErrors.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {passwordErrors.map((err, i) => (
                      <li key={i} className="text-[10px] text-rose-500">
                        {err}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <Input
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="e.g. Ahmad bin Ismail"
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
                >
                  {assignableRoles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {createError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">
                {createError}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={createLoading} className="text-xs gap-1">
                {createLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                {createLoading ? "Creating..." : "Create Account"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* User List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-8 text-center">
            <Users className="mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs text-muted-foreground">
              Try a different search term or create a new user.
            </p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border/70">
            {filteredProfiles.map((profile) => {
              const isProtected = profile.id === currentUserId || profile.role === "super_admin";
              const isUpdating = updatingId === profile.id;

              return (
                <div
                  key={profile.id}
                  className="grid gap-3 border-b border-border/60 p-4 last:border-b-0 md:grid-cols-[1fr_220px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {profile.full_name || profile.email || "Unnamed User"}
                      </p>
                      <span
                        className={
                          getRoleBadgeColor(profile.role) +
                          " inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        }
                      >
                        {getRoleLabel(profile.role)}
                      </span>
                      {profile.id === currentUserId ? <Badge variant="info">You</Badge> : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {profile.email || "No email"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={profile.role}
                      disabled={isProtected || isUpdating}
                      onChange={(event) =>
                        handleUpdateRole(profile, event.target.value as UserRole)
                      }
                      className="h-9 flex-1 rounded-lg border border-border bg-card/60 px-3 text-xs outline-none focus:border-primary/50 disabled:opacity-50"
                    >
                      {profile.role === "super_admin" ? (
                        <option value="super_admin">Super Admin</option>
                      ) : null}
                      {assignableRoles.map((ro) => (
                        <option key={ro.value} value={ro.value}>
                          {ro.label}
                        </option>
                      ))}
                    </select>
                    {isUpdating && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          {profiles.length} user{profiles.length !== 1 ? "s" : ""} total
        </p>
      </CardContent>
    </Card>
  );
}
