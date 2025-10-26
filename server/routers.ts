import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

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
});

export type AppRouter = typeof appRouter;

