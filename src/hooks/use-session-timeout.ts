"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_MS = 25 * 60 * 1000;

export function useSessionTimeout() {
  const router = useRouter();
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login?reason=timeout";
  }, []);

  const showWarning = useCallback(() => {
    if (warningShownRef.current) return;
    warningShownRef.current = true;

    toast(
      "Session akan tamat dalam 5 minit. Simpan kerja anda!",
      {
        duration: 30000,
        icon: "⏰",
        style: {
          background: 'var(--card, #1a1a2e)',
          color: 'var(--card-foreground, #fff)',
          border: '1px solid var(--border, #333)',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          maxWidth: '400px',
        },
      }
    );

    setTimeout(() => {
      warningShownRef.current = false;
    }, 30000);
  }, []);

  const resetTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningShownRef.current = false;

    warningTimerRef.current = setTimeout(showWarning, WARNING_MS);
    logoutTimerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
  }, [showWarning, handleLogout]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click", "mousemove"];
    const handleActivity = () => {
      if (!warningShownRef.current) {
        resetTimers();
      }
    };

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetTimers();

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [resetTimers]);
}