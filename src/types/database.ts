// ---------------------------------------------------------------------------
// AIMS Database Types — generated from aims_init.sql + Drizzle schema.ts
// ---------------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ── Enums ──────────────────────────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "admin"
  | "project_admin"
  | "project_manager"
  | "technician"
  | "department_user"
  | "staff"
  | "viewer";

export type HardwareStatus =
  | "active"
  | "standby"
  | "in_repair"
  | "in_store"
  | "retired"
  | "disposed"
  | "lost"
  | "transferred"
  | "reserved"
  | "pending_deployment";

export type HardwareType = "pc" | "laptop" | "printer" | "server" | "projector";

export type HardwareCondition = "good" | "fair" | "damaged";

export type TicketSeverity = "critical" | "high" | "medium" | "low" | "informational";

export type TicketStatus =
  | "open"
  | "assigned"
  | "investigation"
  | "in_repair"
  | "vendor_escalation"
  | "testing"
  | "resolved"
  | "closed";

export type MovementType = "transfer" | "check_out" | "check_in" | "reassignment";

export type PurchaseStatus = "pending" | "approved" | "rejected" | "fulfilled";

export type NotificationChannel = "in_app" | "email" | "sms" | "push" | "whatsapp";

export type AuditAction = "insert" | "update" | "delete";

// ── Row types ──────────────────────────────────────────────────────────────

export interface ProfilesRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface ProjectsRow {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMembersRow {
  id: string;
  project_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface VendorsRow {
  id: string;
  project_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlaPoliciesRow {
  id: string;
  project_id: string;
  name: string;
  critical_hours: number;
  high_hours: number;
  medium_hours: number;
  low_hours: number;
  created_at: string;
}

export interface ContractsRow {
  id: string;
  project_id: string;
  vendor_id: string | null;
  sla_policy_id: string | null;
  contract_number: string;
  start_date: string | null;
  end_date: string | null;
  value: number | null;
  created_at: string;
  updated_at: string;
}

export interface RegionsRow {
  id: string;
  contract_id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatesRow {
  id: string;
  region_id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at: string;
}

export interface FacilitiesRow {
  id: string;
  state_id: string;
  name: string;
  code: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentsRow {
  id: string;
  facility_id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetTypesRow {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface BrandsRow {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface ModelsRow {
  id: string;
  project_id: string;
  brand_id: string;
  asset_type_id: string;
  name: string;
  created_at: string;
}

export interface HardwareTypesRow {
  id: string;
  contract_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SpecCategoriesRow {
  id: string;
  contract_id: string;
  hardware_type_id: string;
  name: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SpecRulesRow {
  id: string;
  spec_category_id: string;
  rule_type: string;
  rule_operator: string;
  rule_value: string;
  created_at: string;
}

export interface HardwareRow {
  id: string;
  department_id: string;
  asset_tag: string | null;
  serial_number: string;
  qr_code: string | null;
  barcode: string | null;
  pic_name: string;
  contact_number: string;
  running_number: string;
  type_hardware: HardwareType;
  brand: string;
  model: string;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  mac_address: string | null;
  ip_address: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  status: HardwareStatus;
  condition: HardwareCondition;
  vendor_id: string | null;
  hardware_type_id: string | null;
  spec_category_id: string | null;
  brand_id: string | null;
  model_id: string | null;
  assigned_user: string | null;
  assigned_department: string | null;
  custodian_team: string | null;
  physical_room: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetMovementsRow {
  id: string;
  hardware_id: string;
  from_department_id: string | null;
  to_department_id: string | null;
  from_pic: string | null;
  to_pic: string | null;
  approved_by: string | null;
  movement_type: MovementType;
  transfer_reason: string | null;
  transfer_date: string;
  attachment_url: string | null;
  created_at: string;
}

export interface AssetAssignmentsRow {
  id: string;
  hardware_id: string;
  assigned_to: string | null;
  assigned_at: string;
  returned_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface MaintenanceLogsRow {
  id: string;
  hardware_id: string;
  performed_at: string;
  performed_by: string | null;
  description: string;
  cost: number | null;
  created_at: string;
}

export interface StatusHistoryRow {
  id: string;
  hardware_id: string;
  from_status: HardwareStatus | null;
  to_status: HardwareStatus;
  changed_at: string;
  changed_by: string | null;
  note: string | null;
}

export interface RepairTicketsRow {
  id: string;
  hardware_id: string;
  severity: TicketSeverity;
  status: TicketStatus;
  sla_policy_id: string | null;
  opened_at: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepairLogsRow {
  id: string;
  ticket_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface RepairAttachmentsRow {
  id: string;
  ticket_id: string;
  url: string;
  created_at: string;
}

export interface SlaEventsRow {
  id: string;
  ticket_id: string;
  status: string;
  breached_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface NotificationsRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  channel: NotificationChannel;
  read_at: string | null;
  created_at: string;
}

export interface NotificationLogsRow {
  id: string;
  notification_id: string;
  status: string;
  metadata: Json | null;
  created_at: string;
}

export interface AttachmentsRow {
  id: string;
  table_name: string;
  record_id: string;
  url: string;
  file_type: string | null;
  created_at: string;
}

export interface ActivityLogsRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  ip_address: string | null;
  device: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface AuditLogsRow {
  id: string;
  table_name: string;
  record_id: string | null;
  action: AuditAction;
  actor_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  browser: string | null;
  session_id: string | null;
  device: string | null;
  created_at: string;
}

export interface WarehouseItemsRow {
  id: string;
  project_id: string;
  name: string;
  sku: string | null;
  quantity: number;
  min_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovementsRow {
  id: string;
  project_id: string;
  warehouse_item_id: string;
  movement_type: MovementType;
  quantity: number;
  note: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface PurchaseRequestsRow {
  id: string;
  project_id: string;
  requester_id: string | null;
  item_name: string;
  quantity: number;
  status: PurchaseStatus;
  note: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface AssetHealthScoresRow {
  id: string;
  hardware_id: string;
  score: number;
  calculated_at: string;
  created_at: string;
}

export interface AnalyticsSnapshotsRow {
  id: string;
  project_id: string;
  snapshot_date: string;
  data: Json;
  created_at: string;
}

// ── Insert types (nullable-friendly for INSERT payloads) ────────────────────

export interface HardwareInsert {
  department_id: string;
  asset_tag?: string | null;
  serial_number: string;
  qr_code?: string | null;
  barcode?: string | null;
  pic_name: string;
  contact_number: string;
  running_number: string;
  type_hardware: HardwareType | string;
  brand: string;
  model: string;
  cpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  mac_address?: string | null;
  ip_address?: string | null;
  purchase_date?: string | null;
  warranty_expiry?: string | null;
  status?: HardwareStatus | string;
  condition?: HardwareCondition | string;
  vendor_id?: string | null;
  hardware_type_id?: string | null;
  spec_category_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  assigned_user?: string | null;
  assigned_department?: string | null;
  custodian_team?: string | null;
  physical_room?: string | null;
  notes?: string | null;
}

export interface RepairTicketsInsert {
  hardware_id: string;
  severity: TicketSeverity | string;
  status?: TicketStatus | string;
  sla_policy_id?: string | null;
  opened_at?: string;
  assigned_to?: string | null;
  title: string;
  description?: string | null;
}

export interface NotificationsInsert {
  user_id: string;
  title: string;
  body?: string | null;
  channel?: NotificationChannel | string;
}

// ── Supabase Database type ─────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: { Row: ProfilesRow; Insert: Partial<ProfilesRow>; Update: Partial<ProfilesRow> };
      projects: { Row: ProjectsRow; Insert: Partial<ProjectsRow>; Update: Partial<ProjectsRow> };
      project_members: {
        Row: ProjectMembersRow;
        Insert: Partial<ProjectMembersRow>;
        Update: Partial<ProjectMembersRow>;
      };
      vendors: { Row: VendorsRow; Insert: Partial<VendorsRow>; Update: Partial<VendorsRow> };
      sla_policies: {
        Row: SlaPoliciesRow;
        Insert: Partial<SlaPoliciesRow>;
        Update: Partial<SlaPoliciesRow>;
      };
      contracts: {
        Row: ContractsRow;
        Insert: Partial<ContractsRow>;
        Update: Partial<ContractsRow>;
      };
      regions: { Row: RegionsRow; Insert: Partial<RegionsRow>; Update: Partial<RegionsRow> };
      states: { Row: StatesRow; Insert: Partial<StatesRow>; Update: Partial<StatesRow> };
      facilities: {
        Row: FacilitiesRow;
        Insert: Partial<FacilitiesRow>;
        Update: Partial<FacilitiesRow>;
      };
      departments: {
        Row: DepartmentsRow;
        Insert: Partial<DepartmentsRow>;
        Update: Partial<DepartmentsRow>;
      };
      asset_types: {
        Row: AssetTypesRow;
        Insert: Partial<AssetTypesRow>;
        Update: Partial<AssetTypesRow>;
      };
      brands: { Row: BrandsRow; Insert: Partial<BrandsRow>; Update: Partial<BrandsRow> };
      models: { Row: ModelsRow; Insert: Partial<ModelsRow>; Update: Partial<ModelsRow> };
      hardware_types: {
        Row: HardwareTypesRow;
        Insert: Partial<HardwareTypesRow>;
        Update: Partial<HardwareTypesRow>;
      };
      spec_categories: {
        Row: SpecCategoriesRow;
        Insert: Partial<SpecCategoriesRow>;
        Update: Partial<SpecCategoriesRow>;
      };
      spec_rules: {
        Row: SpecRulesRow;
        Insert: Partial<SpecRulesRow>;
        Update: Partial<SpecRulesRow>;
      };
      hardware: { Row: HardwareRow; Insert: HardwareInsert; Update: Partial<HardwareInsert> };
      asset_movements: {
        Row: AssetMovementsRow;
        Insert: Partial<AssetMovementsRow>;
        Update: Partial<AssetMovementsRow>;
      };
      asset_assignments: {
        Row: AssetAssignmentsRow;
        Insert: Partial<AssetAssignmentsRow>;
        Update: Partial<AssetAssignmentsRow>;
      };
      maintenance_logs: {
        Row: MaintenanceLogsRow;
        Insert: Partial<MaintenanceLogsRow>;
        Update: Partial<MaintenanceLogsRow>;
      };
      status_history: {
        Row: StatusHistoryRow;
        Insert: Partial<StatusHistoryRow>;
        Update: Partial<StatusHistoryRow>;
      };
      repair_tickets: {
        Row: RepairTicketsRow;
        Insert: RepairTicketsInsert;
        Update: Partial<RepairTicketsInsert>;
      };
      repair_logs: {
        Row: RepairLogsRow;
        Insert: Partial<RepairLogsRow>;
        Update: Partial<RepairLogsRow>;
      };
      repair_attachments: {
        Row: RepairAttachmentsRow;
        Insert: Partial<RepairAttachmentsRow>;
        Update: Partial<RepairAttachmentsRow>;
      };
      sla_events: {
        Row: SlaEventsRow;
        Insert: Partial<SlaEventsRow>;
        Update: Partial<SlaEventsRow>;
      };
      notifications: {
        Row: NotificationsRow;
        Insert: NotificationsInsert;
        Update: Partial<NotificationsInsert>;
      };
      notification_logs: {
        Row: NotificationLogsRow;
        Insert: Partial<NotificationLogsRow>;
        Update: Partial<NotificationLogsRow>;
      };
      attachments: {
        Row: AttachmentsRow;
        Insert: Partial<AttachmentsRow>;
        Update: Partial<AttachmentsRow>;
      };
      activity_logs: {
        Row: ActivityLogsRow;
        Insert: Partial<ActivityLogsRow>;
        Update: Partial<ActivityLogsRow>;
      };
      audit_logs: {
        Row: AuditLogsRow;
        Insert: Partial<AuditLogsRow>;
        Update: Partial<AuditLogsRow>;
      };
      warehouse_items: {
        Row: WarehouseItemsRow;
        Insert: Partial<WarehouseItemsRow>;
        Update: Partial<WarehouseItemsRow>;
      };
      stock_movements: {
        Row: StockMovementsRow;
        Insert: Partial<StockMovementsRow>;
        Update: Partial<StockMovementsRow>;
      };
      purchase_requests: {
        Row: PurchaseRequestsRow;
        Insert: Partial<PurchaseRequestsRow>;
        Update: Partial<PurchaseRequestsRow>;
      };
      asset_health_scores: {
        Row: AssetHealthScoresRow;
        Insert: Partial<AssetHealthScoresRow>;
        Update: Partial<AssetHealthScoresRow>;
      };
      analytics_snapshots: {
        Row: AnalyticsSnapshotsRow;
        Insert: Partial<AnalyticsSnapshotsRow>;
        Update: Partial<AnalyticsSnapshotsRow>;
      };
    };
    Enums: {
      user_role: UserRole;
      hardware_status: HardwareStatus;
      hardware_type: HardwareType;
      hardware_condition: HardwareCondition;
      ticket_severity: TicketSeverity;
      ticket_status: TicketStatus;
      movement_type: MovementType;
      purchase_status: PurchaseStatus;
      notification_channel: NotificationChannel;
      audit_action: AuditAction;
    };
  };
}
