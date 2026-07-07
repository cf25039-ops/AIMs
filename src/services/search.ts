import { createClient } from "@/lib/supabase/client";

export type SearchResult = {
  id: string;
  type: "asset" | "ticket" | "contract" | "project" | "vendor";
  title: string;
  subtitle: string;
  href: string;
  icon?: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const supabase = createClient();
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search hardware/assets
  const { data: assets } = await supabase
    .from("hardware")
    .select("id, asset_tag, serial_number, brand, model, type_hardware, status")
    .or(`asset_tag.ilike.%${q}%,serial_number.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`)
    .limit(5);

  if (assets) {
    for (const a of assets) {
      results.push({
        id: a.id,
        type: "asset",
        title: `${a.brand} ${a.model}`.trim() || a.asset_tag,
        subtitle: `${a.asset_tag} — ${a.status}`,
        href: `/assets/${a.id}`,
        icon:
          a.type_hardware === "laptop" ? "Laptop" : a.type_hardware === "pc" ? "Monitor" : "Boxes",
      });
    }
  }

  // Search repair tickets
  const { data: tickets } = await supabase
    .from("repair_tickets")
    .select("id, title, status, severity, opened_at, hardware:hardware_id(asset_tag)")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(5);

  if (tickets) {
    for (const t of tickets) {
      results.push({
        id: t.id,
        type: "ticket",
        title: t.title,
        subtitle: `${(t as unknown as { hardware?: { asset_tag: string } }).hardware?.asset_tag || ""} — ${t.status}`,
        href: `/maintenance/${t.id}`,
        icon: "Wrench",
      });
    }
  }

  // Search contracts
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, contract_number, start_date, end_date, vendor:vendors(name)")
    .or(`contract_number.ilike.%${q}%`)
    .limit(5);

  if (contracts) {
    for (const c of contracts) {
      results.push({
        id: c.id,
        type: "contract",
        title: c.contract_number,
        subtitle: `${(c as unknown as { vendor?: { name: string } }).vendor?.name || "No vendor"} — ends ${c.end_date || "N/A"}`,
        href: "/contracts",
        icon: "FileText",
      });
    }
  }

  // Search projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, code")
    .or(`name.ilike.%${q}%,code.ilike.%${q}%`)
    .limit(5);

  if (projects) {
    for (const p of projects) {
      results.push({
        id: p.id,
        type: "project",
        title: p.name,
        subtitle: `Code: ${p.code}`,
        href: "/projects",
        icon: "FolderKanban",
      });
    }
  }

  // Search vendors
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name, email, phone")
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(5);

  if (vendors) {
    for (const v of vendors) {
      results.push({
        id: v.id,
        type: "vendor",
        title: v.name,
        subtitle: v.email || v.phone || "",
        href: "/vendors",
        icon: "Building",
      });
    }
  }

  return results;
}
