"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getWarehouseItems, getPurchaseRequests } from "@/services/warehouse";
import { Package, AlertTriangle, Box, ShoppingCart, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function WarehousePage() {
  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["warehouse-items"],
    queryFn: getWarehouseItems,
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["purchase-requests"],
    queryFn: getPurchaseRequests,
  });

  const lowStockItems = inventory.filter((item: any) => item.quantity <= item.min_quantity);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Warehouse & Stock</h2>
            <p className="text-sm text-muted-foreground">
              Manage spare parts inventory and purchase requests
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Items</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingInventory ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{inventory.length}</div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-rose-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              {loadingInventory ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {lowStockItems.length}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Purchase Requests</CardTitle>
              <ShoppingCart className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {requests.filter((r: any) => r.status === "pending").length}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Inventory List */}
        <div className="lg:col-span-2 space-y-6">
          <FadeIn delay={0.2}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Stock Inventory</CardTitle>
                <CardDescription>Current quantities of hardware spare parts</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInventory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : inventory.length === 0 ? (
                  <EmptyState
                    icon={Box}
                    title="No inventory items yet"
                    description="Add your first item to start tracking stock levels"
                    action={{
                      label: "Add Inventory Item",
                      onClick: () => alert("Add inventory form here"),
                    }}
                  />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.map((item: any) => {
                          const isLowStock = item.quantity <= item.min_quantity;
                          return (
                            <TableRow
                              key={item.id}
                              className={isLowStock ? "bg-destructive/5" : ""}
                            >
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span>{item.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {item.project?.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {item.sku || "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                <span
                                  className={isLowStock ? "text-rose-600 dark:text-rose-400" : ""}
                                >
                                  {item.quantity}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">
                                  / {item.min_quantity}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {isLowStock ? (
                                  <Badge
                                    variant={"destructive" as any}
                                    className="uppercase text-[10px]"
                                  >
                                    Restock
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant={"success" as any}
                                    className="uppercase text-[10px]"
                                  >
                                    Healthy
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Purchase Requests */}
        <div className="space-y-6">
          <FadeIn delay={0.3}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Purchase Requests</CardTitle>
                <CardDescription>Recent procurement submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : requests.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCart}
                    title="No purchase requests"
                    description="Purchase requests will appear here when submitted"
                  />
                ) : (
                  <div className="space-y-4">
                    {requests.slice(0, 5).map((req: any) => (
                      <div
                        key={req.id}
                        className="flex flex-col gap-1 p-3 rounded-lg border bg-card text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-foreground">{req.item_name}</p>
                          <Badge
                            variant={
                              req.status === "approved"
                                ? ("success" as any)
                                : req.status === "rejected"
                                  ? "destructive"
                                  : ("warning" as any)
                            }
                            className="uppercase text-[9px]"
                          >
                            {req.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-muted-foreground">Req: {req.quantity} Units</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
