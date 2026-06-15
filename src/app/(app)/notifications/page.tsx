"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getNotifications, markNotificationAsRead, markAllAsRead } from "@/services/notifications";
import { Bell, BellRing, Check, CheckCircle2, Clock, Loader2 } from "lucide-react";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const notifications = response?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.read_at).length;

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("alert") || t.includes("urgent") || t.includes("critical")) return <BellRing className="h-5 w-5 text-rose-500" />;
    if (t.includes("success") || t.includes("resolved")) return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    return <Bell className="h-5 w-5 text-primary" />;
  };

  const renderNotificationList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mb-4 opacity-20" />
          <p>You're all caught up!</p>
          <p className="text-xs mt-1">No notifications in this folder.</p>
        </div>
      );
    }

    return (
      <div className="divide-y">
        {list.map((n: any) => (
          <div key={n.id} className={`p-4 hover:bg-muted/30 transition-colors flex gap-4 ${!n.read_at ? 'bg-primary/5' : ''}`}>
            <div className="mt-1 flex-shrink-0">
              {getNotificationIcon(n.title)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
              
              {!n.read_at && (
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs text-primary px-2"
                    onClick={() => markReadMutation.mutate(n.id)}
                    disabled={markReadMutation.isPending}
                  >
                    <Check className="h-3 w-3 mr-1" /> Mark as Read
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <FadeIn className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border-2 border-background">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Notification Center</h2>
            <p className="text-sm text-muted-foreground">Manage your system alerts and automated messages</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="bg-card"
          >
            {markAllReadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Mark All as Read
          </Button>
        )}
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="unread" className="w-full">
              <div className="border-b px-4 py-3 bg-muted/20">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                  <TabsTrigger value="unread" className="gap-2">
                    Unread Inbox 
                    {unreadCount > 0 && <Badge variant={"secondary" as any} className="ml-1 bg-primary/20 text-primary">{unreadCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="unread" className="m-0 focus-visible:outline-none">
                {renderNotificationList(notifications.filter((n: any) => !n.read_at))}
              </TabsContent>

              <TabsContent value="history" className="m-0 focus-visible:outline-none">
                {renderNotificationList(notifications.filter((n: any) => n.read_at))}
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </FadeIn>
    </div>
  );
}
