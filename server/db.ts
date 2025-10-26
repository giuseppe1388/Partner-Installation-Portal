import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  partners, 
  InsertPartner, 
  Partner,
  teams,
  InsertTeam,
  Team,
  installations,
  InsertInstallation,
  Installation,
  apiConfig,
  InsertApiConfig,
  ApiConfig,
  technicians,
  InsertTechnician,
  Technician
} from "../drizzle/schema";
import { ENV } from './_core/env';
import * as bcrypt from 'bcrypt';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Partner Management =====

export async function createPartner(partner: Omit<InsertPartner, 'passwordHash'> & { password: string }): Promise<Partner> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const passwordHash = await bcrypt.hash(partner.password, 10);
  
  const { password, ...partnerData } = partner;
  const result = await db.insert(partners).values({
    ...partnerData,
    passwordHash,
  });

  const insertId = Number((result as any).insertId);
  const [newPartner] = await db.select().from(partners).where(eq(partners.id, insertId));
  return newPartner;
}

export async function getAllPartners(): Promise<Partner[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(partners);
}

export async function getPartnerById(id: number): Promise<Partner | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPartnerByUsername(username: string): Promise<Partner | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(partners).where(eq(partners.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePartner(id: number, data: Partial<Omit<Partner, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'>> & { password?: string }): Promise<Partner | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateData: any = { ...data };
  
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
    delete updateData.password;
  }

  await db.update(partners).set(updateData).where(eq(partners.id, id));
  return await getPartnerById(id);
}

export async function deletePartner(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(partners).where(eq(partners.id, id));
}

export async function verifyPartnerPassword(username: string, password: string): Promise<Partner | null> {
  const partner = await getPartnerByUsername(username);
  if (!partner) return null;

  const isValid = await bcrypt.compare(password, partner.passwordHash);
  return isValid ? partner : null;
}

// ===== Team Management =====

export async function createTeam(team: InsertTeam): Promise<Team> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(teams).values(team);
  const insertId = Number((result as any).insertId);
  const [newTeam] = await db.select().from(teams).where(eq(teams.id, insertId));
  return newTeam;
}

export async function getAllTeams(): Promise<Team[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(teams);
}

export async function getTeamsByPartnerId(partnerId: number): Promise<Team[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(teams).where(eq(teams.partnerId, partnerId));
}

export async function getTeamById(id: number): Promise<Team | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTeam(id: number, data: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Team | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(teams).set(data).where(eq(teams.id, id));
  return await getTeamById(id);
}

export async function deleteTeam(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(teams).where(eq(teams.id, id));
}

// ===== Installation Management =====

export async function createInstallation(installation: InsertInstallation): Promise<Installation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(installations).values(installation);
  const insertId = Number((result as any).insertId);
  const [newInstallation] = await db.select().from(installations).where(eq(installations.id, insertId));
  return newInstallation;
}

export async function getAllInstallations(): Promise<Installation[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(installations);
}

export async function getInstallationsByPartnerId(partnerId: number): Promise<Installation[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(installations).where(eq(installations.partnerId, partnerId));
}

export async function getInstallationById(id: number): Promise<Installation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(installations).where(eq(installations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInstallationByServiceAppointmentId(serviceAppointmentId: string): Promise<Installation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(installations).where(eq(installations.serviceAppointmentId, serviceAppointmentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInstallation(id: number, data: Partial<Omit<Installation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Installation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(installations).set(data).where(eq(installations.id, id));
  return await getInstallationById(id);
}

export async function deleteInstallation(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(installations).where(eq(installations.id, id));
}

// ===== API Configuration Management =====

export async function getApiConfig(configKey: string): Promise<ApiConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(apiConfig).where(eq(apiConfig.configKey, configKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllApiConfigs(): Promise<ApiConfig[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(apiConfig);
}

export async function setApiConfig(configKey: string, configValue: string, description?: string): Promise<ApiConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getApiConfig(configKey);
  
  if (existing) {
    await db.update(apiConfig).set({ configValue, description }).where(eq(apiConfig.configKey, configKey));
    return (await getApiConfig(configKey))!;
  } else {
    const result = await db.insert(apiConfig).values({ configKey, configValue, description });
    const insertId = Number((result as any).insertId);
    const [newConfig] = await db.select().from(apiConfig).where(eq(apiConfig.id, insertId));
    return newConfig;
  }
}

export async function deleteApiConfig(configKey: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(apiConfig).where(eq(apiConfig.configKey, configKey));
}


// ===== Technician Management =====

export async function createTechnician(technician: InsertTechnician): Promise<Technician> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(technicians).values(technician);
  const insertId = Number((result as any).insertId);
  const [newTechnician] = await db.select().from(technicians).where(eq(technicians.id, insertId));
  return newTechnician;
}

export async function getTechnicianByUsername(username: string): Promise<Technician | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(technicians).where(eq(technicians.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTechnicianById(id: number): Promise<Technician | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTechniciansByTeamId(teamId: number): Promise<Technician[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(technicians).where(eq(technicians.teamId, teamId));
}

export async function getTechniciansByPartnerId(partnerId: number): Promise<Technician[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(technicians).where(eq(technicians.partnerId, partnerId));
}

export async function updateTechnician(id: number, data: Partial<Omit<Technician, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Technician | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(technicians).set(data).where(eq(technicians.id, id));
  return await getTechnicianById(id);
}

export async function deleteTechnician(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(technicians).where(eq(technicians.id, id));
}

export async function verifyTechnicianPassword(username: string, password: string): Promise<Technician | null> {
  const technician = await getTechnicianByUsername(username);
  if (!technician) return null;

  const isValid = await bcrypt.compare(password, technician.passwordHash);
  return isValid ? technician : null;
}

export async function getInstallationsByTeamId(teamId: number): Promise<Installation[]> {
  const db = await getDb();
  if (!db) return [];

  const { and, ne } = await import('drizzle-orm');
  return await db.select().from(installations).where(
    and(
      eq(installations.teamId, teamId),
      ne(installations.status, 'cancelled')
    )
  );
}

