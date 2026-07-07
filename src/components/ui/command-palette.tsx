"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Building2,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Wrench,
  Boxes,
  FileDown,
  Layers,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";
import { globalSearch, type SearchResult } from "@/services/search";
import toast from "react-hot-toast";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const router = useRouter();
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    setSearchResults([]);
    command();
  }, []);

  const handleSearch = React.useCallback(async (value: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await globalSearch(value);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  }, []);

  const handleLogout = React.useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, []);

  const typeIcons: Record<string, any> = {
    asset: Boxes,
    ticket: Wrench,
    contract: FileText,
    project: FolderKanban,
    vendor: Building2,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-background/20 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-xl pointer-events-auto"
            >
              <Command
                className="overflow-hidden rounded-xl border border-border/50 bg-background/50 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                }}
              >
                <CommandInput
                  autoFocus
                  placeholder="Search or type a command..."
                  className="border-none focus:ring-0 text-foreground"
                  onValueChange={handleSearch}
                />
                <CommandList className="max-h-[60vh] overflow-y-auto">
                  <CommandEmpty>{isSearching ? "Searching..." : "No results found."}</CommandEmpty>

                  {searchResults.length > 0 && (
                    <CommandGroup heading="Search Results">
                      {searchResults.map((r) => {
                        const Icon = typeIcons[r.type] || Boxes;
                        return (
                          <CommandItem
                            key={`${r.type}-${r.id}`}
                            onSelect={() => runCommand(() => router.push(r.href))}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            <span className="flex-1 truncate">{r.title}</span>
                            <span className="text-xs text-muted-foreground">{r.subtitle}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}

                  {searchResults.length > 0 && <CommandSeparator className="bg-border/50" />}

                  <CommandGroup heading="Quick Actions">
                    <CommandItem onSelect={() => runCommand(() => router.push("/assets/add"))}>
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Add Asset</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => runCommand(() => router.push("/maintenance/create"))}
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      <span>Report Issue</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        runCommand(() => {
                          toast.success("Exporting report...");
                          // Trigger export logic here
                        })
                      }
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      <span>Export Report</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => runCommand(() => router.push("/settings/catalog"))}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      <span>Manage Catalog</span>
                    </CommandItem>
                  </CommandGroup>

                  <CommandSeparator className="bg-border/50" />

                  <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/projects"))}>
                      <FolderKanban className="mr-2 h-4 w-4" />
                      <span>Projects</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/assets"))}>
                      <Boxes className="mr-2 h-4 w-4" />
                      <span>Assets</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/contracts"))}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Contracts</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/maintenance"))}>
                      <Ticket className="mr-2 h-4 w-4" />
                      <span>Maintenance</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/vendors"))}>
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>Vendors</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/reports"))}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Reports</span>
                    </CommandItem>
                  </CommandGroup>

                  <CommandSeparator className="bg-border/50" />

                  <CommandGroup heading="Settings">
                    <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                      <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(handleLogout)}>
                      <LogOut className="mr-2 h-4 w-4 text-destructive" />
                      <span className="text-destructive">Logout</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
