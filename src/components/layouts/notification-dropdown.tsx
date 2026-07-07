"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Info, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ["topbar-notifications"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
      return data || [];
    },
    refetchInterval: 15000, // Refetch every 15s to keep in-app updates hot!
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (!error) {
      refetch();
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      refetch();
    }
  };

  // Date Formatter helper
  const formatNotificationDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} at ${hours}:${minutes}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted/80 text-muted-foreground hover:text-foreground focus:outline-none",
          isOpen && "bg-muted text-foreground",
        )}
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-background shadow-md shadow-rose-500/20"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-semibold text-primary hover:text-primary-foreground hover:underline transition-colors focus:outline-none"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3 text-muted-foreground/60">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                    No new alerts or system updates currently.
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const isUnread = !item.read_at;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group relative flex items-start gap-3 p-4 transition-all duration-200 hover:bg-muted/30",
                        isUnread && "bg-primary/[0.02]",
                      )}
                    >
                      {/* Left color bar for unread indicator */}
                      {isUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-md" />
                      )}

                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/10">
                          <Info className="h-4 w-4" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={cn(
                              "text-sm font-semibold text-foreground leading-none truncate",
                              isUnread && "font-bold text-foreground",
                            )}
                          >
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-normal line-clamp-2">
                          {item.body}
                        </p>
                        <span className="text-[10px] text-muted-foreground/80 mt-2 block font-medium">
                          {formatNotificationDate(item.created_at)}
                        </span>
                      </div>

                      {/* Dismiss Action Button */}
                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          title="Dismiss"
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md focus:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/40 bg-muted/30 p-2 text-center">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-all duration-200"
              >
                Show All Notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
