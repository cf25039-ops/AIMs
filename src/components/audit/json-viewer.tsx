"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Eye } from "lucide-react";

interface JsonViewerProps {
  oldData: any;
  newData: any;
}

export function JsonViewer({ oldData, newData }: JsonViewerProps) {
  const [showRaw, setShowRaw] = useState(false);

  // Helper to get formatted keys that changed
  const getChanges = () => {
    if (!oldData && !newData) return [];
    
    const changes: { key: string; oldVal: string; newVal: string }[] = [];
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    allKeys.forEach((key) => {
      const oldVal = JSON.stringify(oldData?.[key] ?? null);
      const newVal = JSON.stringify(newData?.[key] ?? null);
      
      if (oldVal !== newVal) {
        changes.push({
          key,
          oldVal: oldData?.[key] !== undefined ? String(oldData[key]) : "N/A",
          newVal: newData?.[key] !== undefined ? String(newData[key]) : "N/A",
        });
      }
    });

    return changes;
  };

  const changes = getChanges();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
          <Eye className="h-3.5 w-3.5" />
          View Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between mt-2">
            <DialogTitle>Data Changes Record</DialogTitle>
            <div className="flex items-center gap-2 mr-6">
              <span className="text-xs text-muted-foreground">Formatted</span>
              <Switch checked={showRaw} onCheckedChange={setShowRaw} />
              <span className="text-xs text-muted-foreground">Raw JSON</span>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto mt-4 rounded-md border">
          {showRaw ? (
            <div className="grid grid-cols-2 divide-x">
              <div className="p-4 bg-destructive/5">
                <p className="text-xs font-semibold mb-2 text-rose-600 dark:text-rose-400">OLD DATA</p>
                <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                  {JSON.stringify(oldData, null, 2) || "null"}
                </pre>
              </div>
              <div className="p-4 bg-emerald-500/5">
                <p className="text-xs font-semibold mb-2 text-emerald-600 dark:text-emerald-400">NEW DATA</p>
                <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                  {JSON.stringify(newData, null, 2) || "null"}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {changes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data changes detected.</p>
              ) : (
                <div className="space-y-4">
                  {changes.map((change) => (
                    <div key={change.key} className="text-sm">
                      <p className="font-medium text-foreground mb-1 capitalize">
                        {change.key.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-1 rounded line-through text-xs max-w-[45%] truncate" title={change.oldVal}>
                          {change.oldVal}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded font-medium text-xs max-w-[45%] truncate" title={change.newVal}>
                          {change.newVal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
