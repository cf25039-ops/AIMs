"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHardwareTypes, createHardwareType, updateHardwareType, deleteHardwareType, type HardwareTypeRow } from "@/services/hardware-types";
import { cn } from "@/lib/utils";

type HardwareTypeManagerProps = {
  contractId: string;
};

export function HardwareTypeManager({ contractId }: HardwareTypeManagerProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("");

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["hardware-types", contractId],
    queryFn: () => getHardwareTypes(contractId),
    enabled: !!contractId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createHardwareType({
        contractId,
        name: newName,
        description: newDesc || undefined,
        icon: newIcon || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware-types", contractId] });
      setNewName("");
      setNewDesc("");
      setNewIcon("");
      setIsAdding(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: { name?: string; description?: string; icon?: string } }) =>
      updateHardwareType(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware-types", contractId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHardwareType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware-types", contractId] });
    },
  });

  if (!contractId) {
    return <p className="text-sm text-muted-foreground">Select a contract first.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Hardware Types</h3>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Type
        </Button>
      </div>

      {isAdding && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Type name (e.g. Laptop)" className="h-9 text-sm" />
          <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="h-9 text-sm" />
          <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="Icon key (optional, e.g. monitor)" className="h-9 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => createMutation.mutate()} disabled={!newName || createMutation.isPending} className="text-xs gap-1">
              {createMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} className="text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : types.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No hardware types defined yet.</p>
      ) : (
        <div className="space-y-1.5">
          {types.map((type) => (
            <TypeRow
              key={type.id}
              type={type}
              isEditing={editingId === type.id}
              onStartEdit={() => setEditingId(type.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(values) => updateMutation.mutate({ id: type.id, values })}
              onDelete={() => {
                if (confirm(`Delete "${type.name}"? Hardware linked to this type will have their category unset.`)) {
                  deleteMutation.mutate(type.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TypeRow({
  type,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  type: HardwareTypeRow;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (values: { name?: string; description?: string; icon?: string }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(type.name);
  const [desc, setDesc] = useState(type.description ?? "");
  const [icon, setIcon] = useState(type.icon ?? "");

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2">
      {isEditing ? (
        <div className="flex-1 space-y-1.5">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-8 text-xs" placeholder="Description" />
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="h-8 text-xs" placeholder="Icon" />
          <div className="flex gap-1.5">
            <Button size="sm" onClick={() => onSave({ name, description: desc, icon })} className="h-7 text-[10px]">Save</Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} className="h-7 text-[10px]">Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{type.name}</p>
            {type.description && <p className="text-[10px] text-muted-foreground truncate">{type.description}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onStartEdit} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}