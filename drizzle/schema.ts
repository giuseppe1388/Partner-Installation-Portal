import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Partner table - stores partner information with Salesforce mapping
 */
export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  /** Salesforce Partner ID for integration */
  salesforcePartnerId: varchar("salesforcePartnerId", { length: 255 }).notNull().unique(),
  /** Partner company name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Partner contact email */
  email: varchar("email", { length: 320 }),
  /** Partner contact phone */
  phone: varchar("phone", { length: 50 }),
  /** Starting address for travel time calculation */
  startingAddress: text("startingAddress"),
  /** Username for partner login */
  username: varchar("username", { length: 100 }).notNull().unique(),
  /** Hashed password for partner login */
  passwordHash: text("passwordHash").notNull(),
  /** Active status */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

/**
 * Team table - stores installation teams with Salesforce mapping
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  /** Salesforce Team ID for integration */
  salesforceTeamId: varchar("salesforceTeamId", { length: 255 }).notNull().unique(),
  /** Partner ID that owns this team */
  partnerId: int("partnerId").notNull(),
  /** Team name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Team description */
  description: text("description"),
  /** Active status */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Installation table - stores installation records from Salesforce
 */
export const installations = mysqlTable("installations", {
  id: int("id").autoincrement().primaryKey(),
  /** Salesforce Service Appointment ID */
  serviceAppointmentId: varchar("serviceAppointmentId", { length: 255 }).notNull().unique(),
  /** Customer full name */
  customerName: varchar("customerName", { length: 255 }).notNull(),
  /** Customer surname */
  customerSurname: varchar("customerSurname", { length: 255 }),
  /** Customer fiscal code */
  customerCF: varchar("customerCF", { length: 50 }),
  /** Customer phone */
  customerPhone: varchar("customerPhone", { length: 50 }),
  /** Customer email */
  customerEmail: varchar("customerEmail", { length: 320 }),
  /** Customer residential address */
  customerAddress: text("customerAddress"),
  /** Installation address (where work will be done) */
  installationAddress: text("installationAddress").notNull(),
  /** Installation type */
  installationType: varchar("installationType", { length: 255 }),
  /** Technical notes for installation */
  technicalNotes: text("technicalNotes"),
  /** Installer notes */
  installerNotes: text("installerNotes"),
  /** JSON array of image URLs to view */
  imagesToView: text("imagesToView"),
  /** Link to Salesforce Digital Experience for completion */
  completionLink: text("completionLink"),
  /** PDF attachment URL */
  pdfUrl: text("pdfUrl"),
  /** Estimated duration in minutes */
  durationMinutes: int("durationMinutes"),
  /** Calculated travel time in minutes (from Google Maps) */
  travelTimeMinutes: int("travelTimeMinutes"),
  /** Installation status */
  status: mysqlEnum("status", ["pending", "accepted", "scheduled", "in_progress", "completed", "cancelled", "rejected"]).default("pending").notNull(),
  /** Rejection reason (when partner rejects the installation) */
  rejectionReason: text("rejectionReason"),
  /** Date/time when installation was accepted by partner */
  acceptedAt: datetime("acceptedAt"),
  /** Assigned team ID (null if not scheduled) */
  teamId: int("teamId"),
  /** Assigned partner ID (null if not scheduled) */
  partnerId: int("partnerId"),
  /** Scheduled start date/time */
  scheduledStart: datetime("scheduledStart"),
  /** Scheduled end date/time */
  scheduledEnd: datetime("scheduledEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Installation = typeof installations.$inferSelect;
export type InsertInstallation = typeof installations.$inferInsert;

/**
 * API Configuration table - stores API keys and URLs for integrations
 */
export const apiConfig = mysqlTable("apiConfig", {
  id: int("id").autoincrement().primaryKey(),
  /** Configuration key (e.g., 'google_maps_api_key', 'salesforce_webhook_url') */
  configKey: varchar("configKey", { length: 100 }).notNull().unique(),
  /** Configuration value (API key or URL) */
  configValue: text("configValue").notNull(),
  /** Configuration description */
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiConfig = typeof apiConfig.$inferSelect;
export type InsertApiConfig = typeof apiConfig.$inferInsert;

/**
 * Technician table - stores field technicians/installers with login credentials
 */
export const technicians = mysqlTable("technicians", {
  id: int("id").autoincrement().primaryKey(),
  /** Team ID this technician belongs to */
  teamId: int("teamId").notNull(),
  /** Partner ID this technician belongs to */
  partnerId: int("partnerId").notNull(),
  /** Technician full name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Technician email */
  email: varchar("email", { length: 320 }),
  /** Technician phone */
  phone: varchar("phone", { length: 50 }),
  /** Username for technician login */
  username: varchar("username", { length: 100 }).notNull().unique(),
  /** Hashed password for technician login */
  passwordHash: text("passwordHash").notNull(),
  /** Active status */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = typeof technicians.$inferInsert;

