"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAnalyticsData, exportHardwareReport } from "@/services/reports";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  PieChart as PieChartIcon,
  Activity,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: getAnalyticsData,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvData = await exportHardwareReport();
      if (!csvData) {
        toast.error("Failed to export data or no data available.");
        return;
      }

      // Create a Blob and trigger download
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `AIMS_Asset_Report_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <PieChartIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Reporting & Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Visualize data and export comprehensive reports
            </p>
          </div>
        </div>

        <Button onClick={handleExport} disabled={isExporting} className="gap-2">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Assets (CSV)
        </Button>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Hardware Status Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Asset Health Distribution
              </CardTitle>
              <CardDescription>
                Overall condition and status of all registered hardware
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : analytics?.hardwareStatusChart.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.hardwareStatusChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analytics?.hardwareStatusChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Severity Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-rose-500" />
                Repair Tickets by Severity
              </CardTitle>
              <CardDescription>
                Analytics of hardware failures and maintenance requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : analytics?.ticketSeverityChart.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No tickets data
                </div>
              ) : (
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.ticketSeverityChart}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" className="text-xs uppercase" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        name="Tickets Count"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card className="glass-card bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Enterprise Data Export</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              Click the &quot;Export Assets&quot; button at the top right to download a comprehensive CSV
              report of all your hardware assets for offline analysis.
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
