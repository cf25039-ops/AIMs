"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getSpecCategories,
  createSpecCategory,
  updateSpecCategory,
  deleteSpecCategory,
  getSpecRules,
  saveSpecRules,
  autoClassifyHardware,
  type SpecCategoryRow,
  type SpecRuleRow,
} from "@/services/spec-categories";
import { getHardwareTypes, type HardwareTypeRow } from "@/services/hardware-types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type SpecCategoryManagerProps = {
  contractId: string;
};

export function SpecCategoryManager({ contractId }: SpecCategoryManagerProps) {
  const queryClient = useQueryClient();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managedCategoryId, setManagedCategoryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("");

  const { data: types = [] } = useQuery({
    queryKey: ["hardware-types", contractId],
    queryFn: () => getHardwareTypes(contractId),
    enabled: !!contractId,
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["spec-categories", selectedTypeId],
    queryFn: () => getSpecCategories(selectedTypeId ?? undefined),
    enabled: !!selectedTypeId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createSpecCategory({
        contractId,
        hardwareTypeId: selectedTypeId!,
        name: newName,
        description: newDesc || undefined,
        color: newColor || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spec-categories", selectedTypeId] });
      setNewName("");
      setNewDesc("");
      setNewColor("");
      setIsAdding(false);
      toast.success("Spec category created successfully!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: { name?: string; description?: string; color?: string } }) =>
      updateSpecCategory(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spec-categories", selectedTypeId] });
      setEditingId(null);
      toast.success("Spec category updated successfully!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSpecCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spec-categories", selectedTypeId] });
      toast.success("Spec category deleted!");
    },
  });

  if (!contractId) {
    return <p className="text-sm text-muted-foreground">Select a contract first.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Spec Categories</h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedTypeId ?? ""}
            onChange={(e) => setSelectedTypeId(e.target.value || null)}
            className="h-9 rounded-lg border border-border bg-card/60 px-3 text-xs outline-none focus:border-primary/50"
          >
            <option value="">Select hardware type...</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {selectedTypeId && (
            <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Spec Category
            </Button>
          )}
        </div>
      </div>

      {!selectedTypeId ? (
        <p className="text-xs text-muted-foreground py-2">Select a hardware type above to manage its spec categories.</p>
      ) : (
        <>
          {isAdding && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name (e.g. Low Spec)" className="h-9 text-sm" />
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="h-9 text-sm" />
              <Input value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Color (e.g. amber, red, green)" className="h-9 text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => createMutation.mutate()} disabled={!newName || createMutation.isPending} className="text-xs gap-1">
                  {createMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} className="text-xs">Cancel</Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No spec categories defined for this hardware type.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    isEditing={editingId === cat.id}
                    isManaging={managedCategoryId === cat.id}
                    onStartEdit={() => setEditingId(cat.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={(values) => updateMutation.mutate({ id: cat.id, values })}
                    onDelete={() => setDeletingId(cat.id)}
                    onManageRules={() => setManagedCategoryId(managedCategoryId === cat.id ? null : cat.id)}
                  />
                ))}
              </div>

              <ConfirmDialog
                open={!!deletingId}
                title="Delete Spec Category"
                message={`Are you sure you want to delete "${categories.find(c => c.id === deletingId)?.name || 'this category'}"? This action cannot be undone.`}
                onClose={() => setDeletingId(null)}
                onConfirm={() => {
                  if (deletingId) {
                    deleteMutation.mutate(deletingId, {
                      onSuccess: () => setDeletingId(null),
                    });
                  }
                }}
                loading={deleteMutation.isPending}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  isEditing,
  isManaging,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onManageRules,
}: {
  category: SpecCategoryRow;
  isEditing: boolean;
  isManaging: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (values: { name?: string; description?: string; color?: string }) => void;
  onDelete: () => void;
  onManageRules: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(category.name);
  const [desc, setDesc] = useState(category.description ?? "");
  const [color, setColor] = useState(category.color ?? "");

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2">
        {isEditing ? (
          <div className="flex-1 space-y-1.5">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-8 text-xs" placeholder="Description" />
            <Input value={color} onChange={(e) => setColor(e.target.value)} className="h-8 text-xs" placeholder="Color" />
            <div className="flex gap-1.5">
              <Button size="sm" onClick={() => onSave({ name, description: desc, color })} className="h-7 text-[10px]">Save</Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit} className="h-7 text-[10px]">Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                {category.color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />}
                {category.name}
              </p>
              {category.description && <p className="text-[10px] text-muted-foreground truncate">{category.description}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onManageRules} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Manage rules">
                <Zap className="h-3.5 w-3.5" />
              </button>
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

      {isManaging && (
        <RuleEditor categoryId={category.id} onClose={() => onManageRules()} />
      )}
    </div>
  );
}

function RuleEditor({ categoryId, onClose }: { categoryId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["spec-rules", categoryId],
    queryFn: () => getSpecRules(categoryId),
  });

  const [localRules, setLocalRules] = useState<Array<{
    id?: string;
    rule_type: string;
    rule_operator: string;
    rule_value: string;
  }>>([]);

  useState(() => {
    if (rules.length > 0) setLocalRules(rules.map((r) => ({ ...r })));
  });

  // Sync when data loads
  useState(() => {
    setLocalRules(rules.map((r) => ({ ...r })) || []);
  });

  const saveMutation = useMutation({
    mutationFn: () => saveSpecRules(categoryId, localRules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spec-rules", categoryId] });
    },
  });

  const classifyMutation = useMutation({
    mutationFn: () => autoClassifyHardware(categoryId),
    onSuccess: (data) => {
      toast.success(`Matched and classified ${data?.matched ?? 0} hardware items.`);
      queryClient.invalidateQueries({ queryKey: ["spec-rules", categoryId] });
    },
  });

  const addRule = () => {
    setLocalRules((prev) => [...prev, { rule_type: "cpu", rule_operator: "contains", rule_value: "" }]);
  };

  const removeRule = (index: number) => {
    setLocalRules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: string, value: string) => {
    setLocalRules((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  return (
    <div className="ml-4 mt-1 p-3 rounded-xl border border-border/50 bg-background/60 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">Classification Rules</h4>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={addRule} className="h-7 text-[10px] gap-1">
            <Plus className="h-3 w-3" />
            Add Rule
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => classifyMutation.mutate()}
            disabled={classifyMutation.isPending}
            className="h-7 text-[10px] gap-1 text-primary"
          >
            <Zap className="h-3 w-3" />
            {classifyMutation.isPending ? "Classifying..." : "Auto-Classify"}
          </Button>
        </div>
      </div>

      {localRules.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">No rules defined. Rules auto-classify hardware into this category.</p>
      ) : (
        <div className="space-y-1.5">
          {localRules.map((rule, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <select
                value={rule.rule_type}
                onChange={(e) => updateRule(index, "rule_type", e.target.value)}
                className="h-8 rounded-lg border border-border bg-card/60 px-2 text-xs outline-none"
              >
                <option value="cpu">CPU</option>
                <option value="ram">RAM</option>
                <option value="storage">Storage</option>
              </select>
              <select
                value={rule.rule_operator}
                onChange={(e) => updateRule(index, "rule_operator", e.target.value)}
                className="h-8 rounded-lg border border-border bg-card/60 px-2 text-xs outline-none w-24"
              >
                <option value="contains">contains</option>
                <option value="eq">equals</option>
                <option value="gte">≥</option>
                <option value="lte">≤</option>
                <option value="gt">&gt;</option>
                <option value="lt">&lt;</option>
              </select>
              <Input
                value={rule.rule_value}
                onChange={(e) => updateRule(index, "rule_value", e.target.value)}
                className="h-8 text-xs flex-1"
                placeholder="Value"
              />
              <button onClick={() => removeRule(index)} className="p-1 hover:bg-rose-500/10 rounded text-muted-foreground hover:text-rose-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="text-xs gap-1"
        >
          {saveMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Save Rules
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} className="text-xs">Close</Button>
      </div>
    </div>
  );
}