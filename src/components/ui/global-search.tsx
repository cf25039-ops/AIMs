"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Loader2,
  Laptop,
  Monitor,
  Boxes,
  Wrench,
  FileText,
  FolderKanban,
  Building,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { globalSearch, type SearchResult } from "@/services/search";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, any> = {
  Laptop,
  Monitor,
  Boxes,
  Wrench,
  FileText,
  FolderKanban,
  Building,
};

const typeLabels: Record<string, string> = {
  asset: "Asset",
  ticket: "Ticket",
  contract: "Contract",
  project: "Project",
  vendor: "Vendor",
};

const typeColors: Record<string, string> = {
  asset: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ticket: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  contract: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  project: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  vendor: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function GlobalSearch({
  placeholder = "Search assets, contracts, tickets...",
}: {
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    const res = await globalSearch(q);
    setResults(res);
    setIsOpen(res.length > 0);
    setSelectedIndex(0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex]);
    }
  };

  const navigateTo = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    router.push(result.href);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const grouped = results.reduce(
    (acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    },
    {} as Record<string, SearchResult[]>,
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        {query && !isLoading && (
          <button onClick={clearSearch} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!query && !isLoading && (
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 max-h-[400px] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl z-50"
          >
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="border-b border-border/50 last:border-0">
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {typeLabels[type] || type}
                </div>
                {items.map((result) => {
                  const globalIdx = results.findIndex((r) => r.id === result.id);
                  const isSelected = globalIdx === selectedIndex;
                  const Icon = iconMap[result.icon || ""] || Boxes;

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => navigateTo(result)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        isSelected ? "bg-primary/5" : "hover:bg-muted/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          typeColors[result.type],
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border/50">
              {results.length} results — Press <kbd className="rounded bg-muted px-1">Enter</kbd> to
              open, <kbd className="rounded bg-muted px-1">Esc</kbd> to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
