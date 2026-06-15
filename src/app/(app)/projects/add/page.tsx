"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProjectsAddPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/projects?add=true");
  }, [router]);

  return null;
}