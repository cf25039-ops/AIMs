import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "project_admin",
  "project_manager",
  "technician",
  "department_user",
  "staff",
  "viewer",
]);

export const hardwareStatusEnum = pgEnum("hardware_status", [
  "active",
  "standby",
  "in_repair",
  "in_store",
  "retired",
  "disposed",
  "lost",
  "transferred",
  "reserved",
  "pending_deployment",
]);

export const hardwareTypeEnum = pgEnum("hardware_type", [
  "pc",
  "laptop",
  "printer",
  "server",
  "projector",
]);

export const hardwareConditionEnum = pgEnum("hardware_condition", ["good", "fair", "damaged"]);

export const ticketSeverityEnum = pgEnum("ticket_severity", [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "assigned",
  "investigation",
  "in_repair",
  "vendor_escalation",
  "testing",
  "resolved",
  "closed",
]);

export const movementTypeEnum = pgEnum("movement_type", [
  "transfer",
  "check_out",
  "check_in",
  "reassignment",
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "pending",
  "approved",
  "rejected",
  "fulfilled",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "sms",
  "push",
  "whatsapp",
]);

export const auditActionEnum = pgEnum("audit_action", ["insert", "update", "delete"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }),
    fullName: varchar("full_name", { length: 120 }),
    role: userRoleEnum("role").notNull().default("staff"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("profiles_email_unique").on(table.email),
    roleIdx: index("profiles_role_idx").on(table.role),
  }),
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    codeUnique: uniqueIndex("projects_code_unique").on(table.code),
    nameIdx: index("projects_name_idx").on(table.name),
  }),
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("project_members_project_idx").on(table.projectId),
    userIdx: index("project_members_user_idx").on(table.userId),
    projectUserUnique: uniqueIndex("project_members_project_user_unique").on(
      table.projectId,
      table.userId,
    ),
  }),
);

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 40 }),
    status: varchar("status", { length: 40 }).default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("vendors_project_idx").on(table.projectId),
    nameIdx: index("vendors_name_idx").on(table.name),
  }),
);

export const slaPolicies = pgTable(
  "sla_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    criticalHours: integer("critical_hours").notNull(),
    highHours: integer("high_hours").notNull(),
    mediumHours: integer("medium_hours").notNull(),
    lowHours: integer("low_hours").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("sla_policies_project_idx").on(table.projectId),
  }),
);

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    vendorId: uuid("vendor_id").references(() => vendors.id, {
      onDelete: "set null",
    }),
    slaPolicyId: uuid("sla_policy_id").references(() => slaPolicies.id, {
      onDelete: "set null",
    }),
    contractNumber: varchar("contract_number", { length: 80 }).notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    value: numeric("value", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("contracts_project_idx").on(table.projectId),
    projectNumberUnique: uniqueIndex("contracts_project_number_unique").on(
      table.projectId,
      table.contractNumber,
    ),
  }),
);

export const regions = pgTable(
  "regions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .references(() => contracts.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contractIdx: index("regions_contract_idx").on(table.contractId),
    contractNameUnique: uniqueIndex("regions_contract_name_unique").on(
      table.contractId,
      table.name,
    ),
  }),
);

export const states = pgTable(
  "states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    regionId: uuid("region_id")
      .references(() => regions.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    regionIdx: index("states_region_idx").on(table.regionId),
    regionNameUnique: uniqueIndex("states_region_name_unique").on(table.regionId, table.name),
  }),
);

export const facilities = pgTable(
  "facilities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stateId: uuid("state_id")
      .references(() => states.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    code: varchar("code", { length: 50 }),
    address: text("address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    stateIdx: index("facilities_state_idx").on(table.stateId),
    stateNameUnique: uniqueIndex("facilities_state_name_unique").on(table.stateId, table.name),
  }),
);

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    facilityId: uuid("facility_id")
      .references(() => facilities.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    code: varchar("code", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    facilityIdx: index("departments_facility_idx").on(table.facilityId),
    facilityNameUnique: uniqueIndex("departments_facility_name_unique").on(
      table.facilityId,
      table.name,
    ),
  }),
);

export const assetTypes = pgTable(
  "asset_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("asset_types_project_idx").on(table.projectId),
    nameUnique: uniqueIndex("asset_types_project_name_unique").on(table.projectId, table.name),
  }),
);

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("brands_project_idx").on(table.projectId),
    nameUnique: uniqueIndex("brands_project_name_unique").on(table.projectId, table.name),
  }),
);

export const models = pgTable(
  "models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    brandId: uuid("brand_id")
      .references(() => brands.id, { onDelete: "cascade" })
      .notNull(),
    assetTypeId: uuid("asset_type_id")
      .references(() => assetTypes.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("models_project_idx").on(table.projectId),
    brandIdx: index("models_brand_idx").on(table.brandId),
    typeIdx: index("models_type_idx").on(table.assetTypeId),
    nameUnique: uniqueIndex("models_project_name_unique").on(table.projectId, table.name),
  }),
);

export const hardwareTypes = pgTable(
  "hardware_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .references(() => contracts.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 40 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contractIdx: index("hardware_types_contract_idx").on(table.contractId),
    contractNameUnique: uniqueIndex("hardware_types_contract_name_unique").on(
      table.contractId,
      table.name,
    ),
  }),
);

export const specCategories = pgTable(
  "spec_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .references(() => contracts.id, { onDelete: "cascade" })
      .notNull(),
    hardwareTypeId: uuid("hardware_type_id")
      .references(() => hardwareTypes.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 20 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contractIdx: index("spec_categories_contract_idx").on(table.contractId),
    typeIdx: index("spec_categories_type_idx").on(table.hardwareTypeId),
    typeNameUnique: uniqueIndex("spec_categories_type_name_unique").on(
      table.hardwareTypeId,
      table.name,
    ),
  }),
);

export const specRules = pgTable(
  "spec_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    specCategoryId: uuid("spec_category_id")
      .references(() => specCategories.id, { onDelete: "cascade" })
      .notNull(),
    ruleType: varchar("rule_type", { length: 40 }).notNull(),
    ruleOperator: varchar("rule_operator", { length: 10 }).notNull().default("eq"),
    ruleValue: varchar("rule_value", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("spec_rules_category_idx").on(table.specCategoryId),
  }),
);

export const hardware = pgTable(
  "hardware",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    departmentId: uuid("department_id")
      .references(() => departments.id, { onDelete: "cascade" })
      .notNull(),
    assetTag: varchar("asset_tag", { length: 80 }),
    serialNumber: varchar("serial_number", { length: 120 }).notNull(),
    qrCode: varchar("qr_code", { length: 255 }),
    barcode: varchar("barcode", { length: 255 }),
    picName: varchar("pic_name", { length: 120 }).notNull(),
    contactNumber: varchar("contact_number", { length: 40 }).notNull(),
    runningNumber: varchar("running_number", { length: 80 }).notNull(),
    typeHardware: hardwareTypeEnum("type_hardware").notNull(),
    brand: varchar("brand", { length: 80 }).notNull(),
    model: varchar("model", { length: 80 }).notNull(),
    cpu: varchar("cpu", { length: 80 }),
    ram: varchar("ram", { length: 40 }),
    storage: varchar("storage", { length: 80 }),
    macAddress: varchar("mac_address", { length: 32 }),
    ipAddress: varchar("ip_address", { length: 48 }),
    purchaseDate: date("purchase_date"),
    warrantyExpiry: date("warranty_expiry"),
    status: hardwareStatusEnum("status").notNull().default("active"),
    condition: hardwareConditionEnum("condition").notNull().default("good"),
    vendorId: uuid("vendor_id").references(() => vendors.id, {
      onDelete: "set null",
    }),
    hardwareTypeId: uuid("hardware_type_id").references(() => hardwareTypes.id, {
      onDelete: "set null",
    }),
    specCategoryId: uuid("spec_category_id").references(() => specCategories.id, {
      onDelete: "set null",
    }),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    modelId: uuid("model_id").references(() => models.id, {
      onDelete: "set null",
    }),
    assignedUser: varchar("assigned_user", { length: 120 }),
    assignedDepartment: varchar("assigned_department", { length: 120 }),
    custodianTeam: varchar("custodian_team", { length: 120 }),
    physicalRoom: varchar("physical_room", { length: 120 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    serialUnique: uniqueIndex("hardware_serial_unique").on(table.serialNumber),
    assetTagUnique: uniqueIndex("hardware_asset_tag_unique").on(table.assetTag),
    departmentIdx: index("hardware_department_idx").on(table.departmentId),
    statusIdx: index("hardware_status_idx").on(table.status),
    warrantyIdx: index("hardware_warranty_idx").on(table.warrantyExpiry),
    typeIdx: index("hardware_type_idx").on(table.hardwareTypeId),
    specCategoryIdx: index("hardware_spec_category_idx").on(table.specCategoryId),
    brandIdx: index("hardware_brand_idx").on(table.brandId),
    modelIdx: index("hardware_model_idx").on(table.modelId),
  }),
);

export const assetMovements = pgTable(
  "asset_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hardwareId: uuid("hardware_id")
      .references(() => hardware.id, { onDelete: "cascade" })
      .notNull(),
    fromDepartmentId: uuid("from_department_id").references(() => departments.id),
    toDepartmentId: uuid("to_department_id").references(() => departments.id),
    fromPic: varchar("from_pic", { length: 120 }),
    toPic: varchar("to_pic", { length: 120 }),
    approvedBy: uuid("approved_by").references(() => profiles.id),
    movementType: movementTypeEnum("movement_type").notNull(),
    transferReason: text("transfer_reason"),
    transferDate: timestamp("transfer_date", { withTimezone: true }).defaultNow().notNull(),
    attachmentUrl: varchar("attachment_url", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hardwareIdx: index("asset_movements_hardware_idx").on(table.hardwareId),
    toDepartmentIdx: index("asset_movements_to_department_idx").on(table.toDepartmentId),
  }),
);

export const assetAssignments = pgTable(
  "asset_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hardwareId: uuid("hardware_id")
      .references(() => hardware.id, { onDelete: "cascade" })
      .notNull(),
    assignedTo: uuid("assigned_to").references(() => profiles.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    returnedAt: timestamp("returned_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hardwareIdx: index("asset_assignments_hardware_idx").on(table.hardwareId),
  }),
);

export const maintenanceLogs = pgTable(
  "maintenance_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hardwareId: uuid("hardware_id")
      .references(() => hardware.id, { onDelete: "cascade" })
      .notNull(),
    performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow().notNull(),
    performedBy: uuid("performed_by").references(() => profiles.id),
    description: text("description").notNull(),
    cost: numeric("cost", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hardwareIdx: index("maintenance_logs_hardware_idx").on(table.hardwareId),
  }),
);

export const statusHistory = pgTable(
  "status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hardwareId: uuid("hardware_id")
      .references(() => hardware.id, { onDelete: "cascade" })
      .notNull(),
    fromStatus: hardwareStatusEnum("from_status"),
    toStatus: hardwareStatusEnum("to_status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
    changedBy: uuid("changed_by").references(() => profiles.id),
    note: text("note"),
  },
  (table) => ({
    hardwareIdx: index("status_history_hardware_idx").on(table.hardwareId),
  }),
);

export const repairTickets = pgTable(
  "repair_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hardwareId: uuid("hardware_id")
      .references(() => hardware.id, { onDelete: "cascade" })
      .notNull(),
    severity: ticketSeverityEnum("severity").notNull(),
    status: ticketStatusEnum("status").notNull().default("open"),
    slaPolicyId: uuid("sla_policy_id").references(() => slaPolicies.id),
    openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
    assignedTo: uuid("assigned_to").references(() => profiles.id),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hardwareIdx: index("repair_tickets_hardware_idx").on(table.hardwareId),
    statusIdx: index("repair_tickets_status_idx").on(table.status),
  }),
);

export const repairLogs = pgTable(
  "repair_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .references(() => repairTickets.id, { onDelete: "cascade" })
      .notNull(),
    note: text("note").notNull(),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ticketIdx: index("repair_logs_ticket_idx").on(table.ticketId),
  }),
);

export const repairAttachments = pgTable(
  "repair_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .references(() => repairTickets.id, { onDelete: "cascade" })
      .notNull(),
    url: varchar("url", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ticketIdx: index("repair_attachments_ticket_idx").on(table.ticketId),
  }),
);

export const slaEvents = pgTable(
  "sla_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .references(() => repairTickets.id, { onDelete: "cascade" })
      .notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    breachedAt: timestamp("breached_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ticketIdx: index("sla_events_ticket_idx").on(table.ticketId),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body"),
    channel: notificationChannelEnum("channel").notNull().default("in_app"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
  }),
);

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id")
      .references(() => notifications.id, { onDelete: "cascade" })
      .notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    notificationIdx: index("notification_logs_notification_idx").on(table.notificationId),
  }),
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tableName: varchar("table_name", { length: 120 }).notNull(),
    recordId: uuid("record_id").notNull(),
    url: varchar("url", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    recordIdx: index("attachments_record_idx").on(table.recordId),
  }),
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => profiles.id),
    action: varchar("action", { length: 120 }).notNull(),
    entity: varchar("entity", { length: 120 }).notNull(),
    entityId: uuid("entity_id"),
    ipAddress: varchar("ip_address", { length: 64 }),
    device: varchar("device", { length: 255 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actionIdx: index("activity_logs_action_idx").on(table.action),
    entityIdx: index("activity_logs_entity_idx").on(table.entity),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tableName: varchar("table_name", { length: 120 }).notNull(),
    recordId: uuid("record_id"),
    action: auditActionEnum("action").notNull(),
    actorId: uuid("actor_id").references(() => profiles.id),
    oldData: jsonb("old_data"),
    newData: jsonb("new_data"),
    ipAddress: varchar("ip_address", { length: 64 }),
    browser: varchar("browser", { length: 255 }),
    sessionId: varchar("session_id", { length: 128 }),
    device: varchar("device", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tableIdx: index("audit_logs_table_idx").on(table.tableName),
    recordIdx: index("audit_logs_record_idx").on(table.recordId),
  }),
);

export const warehouseItems = pgTable(
  "warehouse_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    sku: varchar("sku", { length: 80 }),
    quantity: integer("quantity").notNull().default(0),
    minQuantity: integer("min_quantity").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("warehouse_items_project_idx").on(table.projectId),
    nameIdx: index("warehouse_items_name_idx").on(table.name),
  }),
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    warehouseItemId: uuid("warehouse_item_id")
      .references(() => warehouseItems.id, { onDelete: "cascade" })
      .notNull(),
    movementType: movementTypeEnum("movement_type").notNull(),
    quantity: integer("quantity").notNull(),
    note: text("note"),
    performedBy: uuid("performed_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    itemIdx: index("stock_movements_item_idx").on(table.warehouseItemId),
    projectIdx: index("stock_movements_project_idx").on(table.projectId),
  }),
);

export const purchaseRequests = pgTable(
  "purchase_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    requesterId: uuid("requester_id").references(() => profiles.id),
    itemName: varchar("item_name", { length: 160 }).notNull(),
    quantity: integer("quantity").notNull(),
    status: purchaseStatusEnum("status").notNull().default("pending"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
  },
  (table) => ({
    projectIdx: index("purchase_requests_project_idx").on(table.projectId),
    statusIdx: index("purchase_requests_status_idx").on(table.status),
  }),
);

export const assetHealthScores = pgTable(
  "asset_health_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hardwareId: uuid("hardware_id")
      .references(() => hardware.id, { onDelete: "cascade" })
      .notNull(),
    score: integer("score").notNull(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hardwareIdx: index("asset_health_scores_hardware_idx").on(table.hardwareId),
  }),
);

export const analyticsSnapshots = pgTable(
  "analytics_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    snapshotDate: date("snapshot_date").notNull(),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("analytics_snapshots_project_idx").on(table.projectId),
  }),
);

export const projectRelations = relations(projects, ({ many }) => ({
  contracts: many(contracts),
  members: many(projectMembers),
  vendors: many(vendors),
  slaPolicies: many(slaPolicies),
  warehouseItems: many(warehouseItems),
  purchaseRequests: many(purchaseRequests),
  analyticsSnapshots: many(analyticsSnapshots),
  assetTypes: many(assetTypes),
  brands: many(brands),
  models: many(models),
}));

export const projectMemberRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(profiles, {
    fields: [projectMembers.userId],
    references: [profiles.id],
  }),
}));

export const vendorRelations = relations(vendors, ({ one, many }) => ({
  project: one(projects, {
    fields: [vendors.projectId],
    references: [projects.id],
  }),
  contracts: many(contracts),
  hardware: many(hardware),
}));

export const slaPolicyRelations = relations(slaPolicies, ({ one, many }) => ({
  project: one(projects, {
    fields: [slaPolicies.projectId],
    references: [projects.id],
  }),
  contracts: many(contracts),
  tickets: many(repairTickets),
}));

export const contractRelations = relations(contracts, ({ one, many }) => ({
  project: one(projects, {
    fields: [contracts.projectId],
    references: [projects.id],
  }),
  vendor: one(vendors, {
    fields: [contracts.vendorId],
    references: [vendors.id],
  }),
  slaPolicy: one(slaPolicies, {
    fields: [contracts.slaPolicyId],
    references: [slaPolicies.id],
  }),
  regions: many(regions),
  hardwareTypes: many(hardwareTypes),
  specCategories: many(specCategories),
}));

export const regionRelations = relations(regions, ({ one, many }) => ({
  contract: one(contracts, {
    fields: [regions.contractId],
    references: [contracts.id],
  }),
  states: many(states),
}));

export const stateRelations = relations(states, ({ one, many }) => ({
  region: one(regions, {
    fields: [states.regionId],
    references: [regions.id],
  }),
  facilities: many(facilities),
}));

export const facilityRelations = relations(facilities, ({ one, many }) => ({
  state: one(states, {
    fields: [facilities.stateId],
    references: [states.id],
  }),
  departments: many(departments),
}));

export const departmentRelations = relations(departments, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [departments.facilityId],
    references: [facilities.id],
  }),
  hardware: many(hardware),
}));

export const assetTypeRelations = relations(assetTypes, ({ one, many }) => ({
  project: one(projects, {
    fields: [assetTypes.projectId],
    references: [projects.id],
  }),
  models: many(models),
}));

export const brandRelations = relations(brands, ({ one, many }) => ({
  project: one(projects, {
    fields: [brands.projectId],
    references: [projects.id],
  }),
  models: many(models),
}));

export const modelRelations = relations(models, ({ one }) => ({
  project: one(projects, {
    fields: [models.projectId],
    references: [projects.id],
  }),
  brand: one(brands, {
    fields: [models.brandId],
    references: [brands.id],
  }),
  assetType: one(assetTypes, {
    fields: [models.assetTypeId],
    references: [assetTypes.id],
  }),
}));

export const hardwareRelations = relations(hardware, ({ one, many }) => ({
  department: one(departments, {
    fields: [hardware.departmentId],
    references: [departments.id],
  }),
  vendor: one(vendors, {
    fields: [hardware.vendorId],
    references: [vendors.id],
  }),
  hardwareType: one(hardwareTypes, {
    fields: [hardware.hardwareTypeId],
    references: [hardwareTypes.id],
  }),
  specCategory: one(specCategories, {
    fields: [hardware.specCategoryId],
    references: [specCategories.id],
  }),
  brand: one(brands, {
    fields: [hardware.brandId],
    references: [brands.id],
  }),
  model: one(models, {
    fields: [hardware.modelId],
    references: [models.id],
  }),
  maintenanceLogs: many(maintenanceLogs),
  statusHistory: many(statusHistory),
  repairTickets: many(repairTickets),
  assetMovements: many(assetMovements),
  assetAssignments: many(assetAssignments),
  healthScores: many(assetHealthScores),
}));

export const hardwareTypeRelations = relations(hardwareTypes, ({ one, many }) => ({
  contract: one(contracts, {
    fields: [hardwareTypes.contractId],
    references: [contracts.id],
  }),
  specCategories: many(specCategories),
  hardware: many(hardware),
}));

export const specCategoryRelations = relations(specCategories, ({ one, many }) => ({
  contract: one(contracts, {
    fields: [specCategories.contractId],
    references: [contracts.id],
  }),
  hardwareType: one(hardwareTypes, {
    fields: [specCategories.hardwareTypeId],
    references: [hardwareTypes.id],
  }),
  rules: many(specRules),
  hardware: many(hardware),
}));

export const specRuleRelations = relations(specRules, ({ one }) => ({
  specCategory: one(specCategories, {
    fields: [specRules.specCategoryId],
    references: [specCategories.id],
  }),
}));

export const assetMovementRelations = relations(assetMovements, ({ one }) => ({
  hardware: one(hardware, {
    fields: [assetMovements.hardwareId],
    references: [hardware.id],
  }),
  fromDepartment: one(departments, {
    fields: [assetMovements.fromDepartmentId],
    references: [departments.id],
  }),
  toDepartment: one(departments, {
    fields: [assetMovements.toDepartmentId],
    references: [departments.id],
  }),
  approvedByUser: one(profiles, {
    fields: [assetMovements.approvedBy],
    references: [profiles.id],
  }),
}));

export const assetAssignmentRelations = relations(assetAssignments, ({ one }) => ({
  hardware: one(hardware, {
    fields: [assetAssignments.hardwareId],
    references: [hardware.id],
  }),
  assignedToUser: one(profiles, {
    fields: [assetAssignments.assignedTo],
    references: [profiles.id],
  }),
}));

export const maintenanceLogRelations = relations(maintenanceLogs, ({ one }) => ({
  hardware: one(hardware, {
    fields: [maintenanceLogs.hardwareId],
    references: [hardware.id],
  }),
  performedByUser: one(profiles, {
    fields: [maintenanceLogs.performedBy],
    references: [profiles.id],
  }),
}));

export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  hardware: one(hardware, {
    fields: [statusHistory.hardwareId],
    references: [hardware.id],
  }),
  changedByUser: one(profiles, {
    fields: [statusHistory.changedBy],
    references: [profiles.id],
  }),
}));

export const repairTicketRelations = relations(repairTickets, ({ one, many }) => ({
  hardware: one(hardware, {
    fields: [repairTickets.hardwareId],
    references: [hardware.id],
  }),
  slaPolicy: one(slaPolicies, {
    fields: [repairTickets.slaPolicyId],
    references: [slaPolicies.id],
  }),
  assignedToUser: one(profiles, {
    fields: [repairTickets.assignedTo],
    references: [profiles.id],
  }),
  logs: many(repairLogs),
  attachments: many(repairAttachments),
  slaEvents: many(slaEvents),
}));

export const repairLogRelations = relations(repairLogs, ({ one }) => ({
  ticket: one(repairTickets, {
    fields: [repairLogs.ticketId],
    references: [repairTickets.id],
  }),
  createdByUser: one(profiles, {
    fields: [repairLogs.createdBy],
    references: [profiles.id],
  }),
}));

export const repairAttachmentRelations = relations(repairAttachments, ({ one }) => ({
  ticket: one(repairTickets, {
    fields: [repairAttachments.ticketId],
    references: [repairTickets.id],
  }),
}));

export const slaEventRelations = relations(slaEvents, ({ one }) => ({
  ticket: one(repairTickets, {
    fields: [slaEvents.ticketId],
    references: [repairTickets.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one, many }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
  logs: many(notificationLogs),
}));

export const notificationLogRelations = relations(notificationLogs, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationLogs.notificationId],
    references: [notifications.id],
  }),
}));

export const activityLogRelations = relations(activityLogs, ({ one }) => ({
  actor: one(profiles, {
    fields: [activityLogs.actorId],
    references: [profiles.id],
  }),
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  actor: one(profiles, {
    fields: [auditLogs.actorId],
    references: [profiles.id],
  }),
}));

export const warehouseItemRelations = relations(warehouseItems, ({ one, many }) => ({
  project: one(projects, {
    fields: [warehouseItems.projectId],
    references: [projects.id],
  }),
  stockMovements: many(stockMovements),
}));

export const stockMovementRelations = relations(stockMovements, ({ one }) => ({
  project: one(projects, {
    fields: [stockMovements.projectId],
    references: [projects.id],
  }),
  warehouseItem: one(warehouseItems, {
    fields: [stockMovements.warehouseItemId],
    references: [warehouseItems.id],
  }),
  performedByUser: one(profiles, {
    fields: [stockMovements.performedBy],
    references: [profiles.id],
  }),
}));

export const purchaseRequestRelations = relations(purchaseRequests, ({ one }) => ({
  project: one(projects, {
    fields: [purchaseRequests.projectId],
    references: [projects.id],
  }),
  requester: one(profiles, {
    fields: [purchaseRequests.requesterId],
    references: [profiles.id],
  }),
}));

export const assetHealthScoreRelations = relations(assetHealthScores, ({ one }) => ({
  hardware: one(hardware, {
    fields: [assetHealthScores.hardwareId],
    references: [hardware.id],
  }),
}));

export const analyticsSnapshotRelations = relations(analyticsSnapshots, ({ one }) => ({
  project: one(projects, {
    fields: [analyticsSnapshots.projectId],
    references: [projects.id],
  }),
}));

export const profileRelations = relations(profiles, ({ many }) => ({
  memberships: many(projectMembers),
  maintenanceLogs: many(maintenanceLogs),
  statusHistory: many(statusHistory),
  repairTickets: many(repairTickets),
  repairLogs: many(repairLogs),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  activityLogs: many(activityLogs),
}));
