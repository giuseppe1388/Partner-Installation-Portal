import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { calculateTravelTimeForPartner } from "./googleMaps";
import { sendScheduleToSalesforce } from "./salesforceWebhook";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Admin: Partner Management
  partners: router({
    list: adminProcedure.query(async () => {
      return await db.getAllPartners();
    }),

    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getPartnerById(input.id);
    }),

    create: adminProcedure.input(z.object({
      salesforcePartnerId: z.string().min(1),
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      startingAddress: z.string().optional(),
      username: z.string().min(3),
      password: z.string().min(6),
    })).mutation(async ({ input }) => {
      try {
        return await db.createPartner(input);
      } catch (error: any) {
        if (error.message?.includes('Duplicate entry')) {
          throw new TRPCError({ 
            code: 'CONFLICT', 
            message: 'Username or Salesforce Partner ID already exists' 
          });
        }
        throw error;
      }
    }),

    update: adminProcedure.input(z.object({
      id: z.number(),
      salesforcePartnerId: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      startingAddress: z.string().optional(),
      username: z.string().min(3).optional(),
      password: z.string().min(6).optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updatePartner(id, data);
    }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deletePartner(input.id);
      return { success: true };
    }),
  }),

  // Admin: Team Management
  teams: router({
    list: adminProcedure.query(async () => {
      return await db.getAllTeams();
    }),

    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getTeamById(input.id);
    }),

    getByPartnerId: adminProcedure.input(z.object({ partnerId: z.number() })).query(async ({ input }) => {
      return await db.getTeamsByPartnerId(input.partnerId);
    }),

    create: adminProcedure.input(z.object({
      salesforceTeamId: z.string().min(1),
      partnerId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
    })).mutation(async ({ input }) => {
      try {
        return await db.createTeam(input);
      } catch (error: any) {
        if (error.message?.includes('Duplicate entry')) {
          throw new TRPCError({ 
            code: 'CONFLICT', 
            message: 'Salesforce Team ID already exists' 
          });
        }
        throw error;
      }
    }),

    update: adminProcedure.input(z.object({
      id: z.number(),
      salesforceTeamId: z.string().min(1).optional(),
      partnerId: z.number().optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateTeam(id, data);
    }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteTeam(input.id);
      return { success: true };
    }),
  }),

  // Admin: API Configuration
  apiConfig: router({
    list: adminProcedure.query(async () => {
      return await db.getAllApiConfigs();
    }),

    get: adminProcedure.input(z.object({ configKey: z.string() })).query(async ({ input }) => {
      return await db.getApiConfig(input.configKey);
    }),

    set: adminProcedure.input(z.object({
      configKey: z.string().min(1),
      configValue: z.string().min(1),
      description: z.string().optional(),
    })).mutation(async ({ input }) => {
      return await db.setApiConfig(input.configKey, input.configValue, input.description);
    }),

    delete: adminProcedure.input(z.object({ configKey: z.string() })).mutation(async ({ input }) => {
      await db.deleteApiConfig(input.configKey);
      return { success: true };
    }),
  }),

  // Admin: Installation Management (for viewing/testing)
  installations: router({
    list: adminProcedure.query(async () => {
      return await db.getAllInstallations();
    }),

    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getInstallationById(input.id);
    }),
  }),

  // Partner Authentication
  partner: router({
    login: publicProcedure.input(z.object({
      username: z.string(),
      password: z.string(),
    })).mutation(async ({ input }) => {
      const partner = await db.verifyPartnerPassword(input.username, input.password);
      if (!partner) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }
      if (!partner.isActive) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Partner account is inactive' });
      }
      return {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        salesforcePartnerId: partner.salesforcePartnerId,
        startingAddress: partner.startingAddress,
      };
    }),

    // Get partner's installations
    myInstallations: publicProcedure.input(z.object({ partnerId: z.number() })).query(async ({ input }) => {
      const installations = await db.getInstallationsByPartnerId(input.partnerId);
      return installations;
    }),

    // Get partner's teams
    myTeams: publicProcedure.input(z.object({ partnerId: z.number() })).query(async ({ input }) => {
      const teams = await db.getTeamsByPartnerId(input.partnerId);
      return teams;
    }),

    // Schedule installation
    scheduleInstallation: publicProcedure.input(z.object({
      installationId: z.number(),
      partnerId: z.number(),
      teamId: z.number(),
      scheduledStart: z.string(),
      scheduledEnd: z.string(),
    })).mutation(async ({ input }) => {
      // Calculate travel time
      const installation = await db.getInstallationById(input.installationId);
      if (!installation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Installation not found' });
      }

      const travelTime = await calculateTravelTimeForPartner(
        input.partnerId,
        installation.installationAddress
      );

      // Update installation
      const updated = await db.updateInstallation(input.installationId, {
        partnerId: input.partnerId,
        teamId: input.teamId,
        scheduledStart: new Date(input.scheduledStart),
        scheduledEnd: new Date(input.scheduledEnd),
        travelTimeMinutes: travelTime,
        status: 'scheduled',
      });

      // Send webhook to Salesforce
      const webhookSent = await sendScheduleToSalesforce(input.installationId);
      if (!webhookSent) {
        console.warn('[Partner] Failed to send webhook to Salesforce for installation:', input.installationId);
      }

      return updated;
    }),

    updateInstallationDuration: publicProcedure.input(z.object({
      installationId: z.number(),
      durationMinutes: z.number().min(30).max(480),
    })).mutation(async ({ input }) => {
      const installation = await db.getInstallationById(input.installationId);
      if (!installation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Installation not found' });
      }

      const updated = await db.updateInstallation(input.installationId, {
        durationMinutes: input.durationMinutes,
      });

      if (installation.scheduledStart) {
        const startTime = new Date(installation.scheduledStart);
        const endTime = new Date(startTime.getTime() + input.durationMinutes * 60000);
        await db.updateInstallation(input.installationId, {
          scheduledEnd: endTime,
        });
        await sendScheduleToSalesforce(input.installationId);
      }

      return updated;
    }),

    changeStatus: publicProcedure.input(z.object({
      installationId: z.number(),
      status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']),
    })).mutation(async ({ input }) => {
      const installation = await db.getInstallationById(input.installationId);
      if (!installation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Installation not found' });
      }

      const updated = await db.updateInstallation(input.installationId, {
        status: input.status,
      });

      // Send webhook to Salesforce when status changes to 'scheduled'
      if (input.status === 'scheduled' && installation.scheduledStart && installation.scheduledEnd) {
        const webhookSent = await sendScheduleToSalesforce(input.installationId);
        if (!webhookSent) {
          console.warn('[Partner] Failed to send webhook to Salesforce for installation:', input.installationId);
        }
      }

      return updated;
    }),
  }),

  // Technician: Mobile App for field technicians
  technician: router({
    // Login
    login: publicProcedure.input(z.object({
      username: z.string(),
      password: z.string(),
    })).mutation(async ({ input }) => {
      const technician = await db.verifyTechnicianPassword(input.username, input.password);
      if (!technician || !technician.isActive) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenziali non valide' });
      }

      return {
        id: technician.id,
        name: technician.name,
        email: technician.email,
        phone: technician.phone,
        teamId: technician.teamId,
        partnerId: technician.partnerId,
      };
    }),

    // Get installations for technician's team
    myInstallations: publicProcedure.input(z.object({ teamId: z.number() })).query(async ({ input }) => {
      const installations = await db.getInstallationsByTeamId(input.teamId);
      return installations;
    }),

    // Get installation detail
    getInstallation: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const installation = await db.getInstallationById(input.id);
      if (!installation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Installazione non trovata' });
      }
      return installation;
    }),

    // Update installation status
    updateStatus: publicProcedure.input(z.object({
      installationId: z.number(),
      status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']),
    })).mutation(async ({ input }) => {
      const updated = await db.updateInstallation(input.installationId, {
        status: input.status,
      });
      return updated;
    }),
  }),
});

export type AppRouter = typeof appRouter;

