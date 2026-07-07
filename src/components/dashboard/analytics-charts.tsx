"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

const data = [
  { name: "Jan", repairs: 400, assets: 2400 },
  { name: "Feb", repairs: 300, assets: 2500 },
  { name: "Mar", repairs: 200, assets: 2800 },
  { name: "Apr", repairs: 278, assets: 2908 },
  { name: "May", repairs: 189, assets: 3200 },
  { name: "Jun", repairs: 239, assets: 3400 },
  { name: "Jul", repairs: 349, assets: 3500 },
];

export function AnalyticsCharts() {
  const { theme } = useTheme();

  const primaryColor = theme === "dark" ? "#3B82F6" : "#2563EB";
  const accentColor = theme === "dark" ? "#8B5CF6" : "#7C3AED";

  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Asset Growth vs Repairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRepairs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="assets"
                    stroke={primaryColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAssets)"
                  />
                  <Area
                    type="monotone"
                    dataKey="repairs"
                    stroke={accentColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRepairs)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass-card h-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operational Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-sm font-medium">Recent Tickets</span>
                <span className="text-xs text-muted-foreground">Status</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm">TKT-001 (Server Down)</span>
                <span className="text-xs font-semibold text-destructive">Critical</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm">TKT-002 (Printer Jam)</span>
                <span className="text-xs font-semibold text-warning">Warning</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm">TKT-003 (OS Update)</span>
                <span className="text-xs font-semibold text-success">Resolved</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
