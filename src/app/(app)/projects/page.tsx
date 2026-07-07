"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, FilePlus2, FileText, FolderPlus, Hash, Loader2, Plus, Trash2 } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import toast from "react-hot-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Project = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

async function fetchProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

function roleForProjectMembership(role?: string | null) {
  if (
    role === "super_admin" ||
    role === "admin" ||
    role === "project_manager" ||
    role === "project_admin" ||
    role === "staff"
  ) {
    return role;
  }

  return "project_admin";
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects-list"],
    queryFn: fetchProjects,
  });

  const insertMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a project.");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name,
          code,
          description: description || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      if (!project) throw new Error("Project created but no data returned");

      // Try to bind creator as member - won't block project creation
      const { error: memberError } = await supabase.from("project_members").upsert(
        {
          project_id: project.id,
          user_id: user.id,
          role: roleForProjectMembership(profile?.role),
        },
        { onConflict: "project_id,user_id" },
      );

      if (memberError) {
        console.error("Failed to bind member:", memberError.message);
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-list"] });
      closeDialog();
      toast.success("Project created successfully!");
    },
    onError: (error: Error) => {
      toast.error("Failed to create project: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingProject) {
        throw new Error("No project selected for editing.");
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .update({
          name,
          code,
          description: description || null,
        })
        .eq("id", editingProject.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-list"] });
      closeDialog();
      toast.success("Project updated successfully!");
    },
    onError: (error: Error) => {
      toast.error("Failed to update project: " + error.message);
    },
  });

  const isSaving = insertMutation.isPending || updateMutation.isPending;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-list"] });
      setDeleteTarget(null);
      toast.success("Project deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete project: " + error.message);
    },
  });

  function resetForm() {
    setName("");
    setCode("");
    setDescription("");
    setEditingProject(null);
  }

  function closeDialog() {
    resetForm();
    setDialogOpen(false);
  }

  function openCreateDialog() {
    resetForm();
    setDialogOpen(true);
  }

  function openEditDialog(project: Project) {
    setEditingProject(project);
    setName(project.name);
    setCode(project.code);
    setDescription(project.description || "");
    setDialogOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || !code.trim()) {
      toast.error("Project name and code are required");
      return;
    }

    if (editingProject) {
      updateMutation.mutate();
    } else {
      insertMutation.mutate();
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <FadeIn className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <FolderPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Project Management</h2>
            <p className="text-sm text-muted-foreground">
              Create projects, update registered projects, and add contract numbers.
            </p>
          </div>
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderPlus className="h-5 w-5 text-primary" />
              Projects Directory
            </CardTitle>
            <CardDescription>All registered projects across the organization</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <EmptyState
                  icon={FolderPlus}
                  title="No projects found"
                  description="Get started by creating your first project"
                  action={{ label: "Add Project", onClick: () => setDialogOpen(true) }}
                />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            {project.code}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            {project.description ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => openEditDialog(project)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(project)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Link
                              href={`/contracts/create?projectId=${project.id}`}
                              className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border bg-transparent px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <FilePlus2 className="h-3.5 w-3.5" />
                              Contract
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setDialogOpen(true);
          } else {
            closeDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update the project name, code, or description."
                : "Fill in the details below to create a new project."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g. Infrastructure Upgrade"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-code">Project Code</Label>
              <Input
                id="project-code"
                placeholder="e.g. INFRA-2026"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-desc">Description</Label>
              <Input
                id="project-desc"
                placeholder="Optional description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProject ? "Save Changes" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name || deleteTarget?.code || "this project"}"? This action cannot be undone and will also remove all associated data.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
