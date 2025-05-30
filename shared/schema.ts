import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["admin", "operator", "readonly"]);

// Alert severity enum
export const alertSeverityEnum = pgEnum("alert_severity", ["low", "medium", "high"]);

// Alert status enum
export const alertStatusEnum = pgEnum("alert_status", ["pending", "processing", "resolved", "dismissed"]);

// Device status enum
export const deviceStatusEnum = pgEnum("device_status", ["online", "offline", "error"]);

// Protocol type enum
export const protocolTypeEnum = pgEnum("protocol_type", ["netflow", "sflow", "snmp", "pcap"]);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("readonly").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Network devices table
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull().unique(),
  deviceType: varchar("device_type", { length: 100 }).notNull(),
  protocol: protocolTypeEnum("protocol").notNull(),
  status: deviceStatusEnum("status").default("offline").notNull(),
  description: text("description"),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Traffic data table
export const trafficData = pgTable("traffic_data", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => devices.id),
  sourceIp: varchar("source_ip", { length: 45 }).notNull(),
  destIp: varchar("dest_ip", { length: 45 }).notNull(),
  sourcePort: integer("source_port"),
  destPort: integer("dest_port"),
  protocol: varchar("protocol", { length: 20 }).notNull(),
  bytes: integer("bytes").notNull(),
  packets: integer("packets").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Alerts table
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  status: alertStatusEnum("status").default("pending").notNull(),
  sourceIp: varchar("source_ip", { length: 45 }),
  ruleId: integer("rule_id").references(() => detectionRules.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
});

// Detection rules table
export const detectionRules = pgTable("detection_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ruleType: varchar("rule_type", { length: 100 }).notNull(),
  conditions: jsonb("conditions").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 100 }),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// System configuration table
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSeen: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  resolvedBy: true,
});

export const insertDetectionRuleSchema = createInsertSchema(detectionRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrafficDataSchema = createInsertSchema(trafficData).omit({
  id: true,
  timestamp: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type DetectionRule = typeof detectionRules.$inferSelect;
export type InsertDetectionRule = z.infer<typeof insertDetectionRuleSchema>;
export type TrafficData = typeof trafficData.$inferSelect;
export type InsertTrafficData = z.infer<typeof insertTrafficDataSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
