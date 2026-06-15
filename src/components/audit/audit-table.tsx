"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { JsonViewer } from "./json-viewer";
import { ShieldAlert, Activity } from "lucide-react";

interface AuditTableProps {
  logs: any[];
  type: "system" | "activity";
}

export function AuditTable({ logs, type }: AuditTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-xl border-dashed">
        {type === "system" ? <ShieldAlert className="h-8 w-8 mb-2 opacity-50" /> : <Activity className="h-8 w-8 mb-2 opacity-50" />}
        <p>No logs found.</p>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("delete")) return "destructive";
    if (act.includes("update") || act.includes("transfer")) return "warning";
    if (act.includes("insert") || act.includes("create")) return "success";
    if (act.includes("login") || act.includes("auth")) return "default";
    return "secondary";
  };

  if (type === "system") {
    return (
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>User / Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Table</TableHead>
              <TableHead className="text-right">Data Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{log.profiles?.full_name || "System Actor"}</span>
                    <span className="text-xs text-muted-foreground">{log.profiles?.email || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getActionColor(log.action) as any} className="uppercase text-[10px]">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.table_name}</code>
                </TableCell>
                <TableCell className="text-right">
                  <JsonViewer oldData={log.old_data} newData={log.new_data} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead className="text-right">IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs whitespace-nowrap">
                {new Date(log.created_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{log.profiles?.full_name || "System"}</span>
                  <span className="text-xs text-muted-foreground">{log.profiles?.email || "Auto-generated"}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm capitalize font-medium">{log.action.replace(/_/g, ' ')}</span>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.entity}</code>
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                {log.ip_address || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
