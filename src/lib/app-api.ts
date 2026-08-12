import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loginSchema = z.object({
  playerId: z.string().uuid(),
  password: z.string().min(5),
});

const registerSchema = z.object({
  nome: z.string().min(2).max(60),
  nickname: z.string().max(30).optional().nullable(),
  telefone: z.string().regex(/^\d{3}-\d{3}$/),
  password: z.string().regex(/^\d{5,}$/),
});

const reviewSchema = z.object({
  requestId: z.string().uuid(),
  approve: z.boolean(),
  nivel: z.enum(["01", "02", "gerente", "motoqueiro", "membro", "novato"]),
  reason: z.string().optional(),
});

const movementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["entrada", "saida"]),
  quantity: z.number().positive(),
  reason: z.string().optional(),
});

const saleSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  buyerName: z.string().min(1),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
});

export const getCurrentAuth = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.getCurrentAuthState();
});

export const loginWithPlayer = createServerFn({ method: "POST" })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const mod = await import("@/lib/app-backend.server");
    return mod.loginPlayer(data.playerId, data.password);
  });

export const logoutFromApp = createServerFn({ method: "POST" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.logoutPlayer();
});

export const registerPlayerRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const mod = await import("@/lib/app-backend.server");
    return mod.registerPlayer(data);
  });

export const getLoginPlayers = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.listLoginPlayers();
});

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.listCategories();
});

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.listProducts();
});

export const getMovements = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.listMovements();
});

export const getSales = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.listSales();
});

export const getGoals = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.listGoals();
});

export const getMembers = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.listMembers();
});

export const getPendingSignupRequests = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.listPendingSignupRequests();
});

export const getAuditLogs = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("@/lib/app-backend.server");
  return mod.listAuditLogs();
});

export const submitSignupReview = createServerFn({ method: "POST" })
  .validator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ data }) => {
    const mod = await import("@/lib/app-backend.server");
    return mod.reviewSignupRequest(data);
  });

export const submitMovement = createServerFn({ method: "POST" })
  .validator((data: unknown) => movementSchema.parse(data))
  .handler(async ({ data }) => {
    const mod = await import("@/lib/app-backend.server");
    return mod.createMovement(data);
  });

export const submitSale = createServerFn({ method: "POST" })
  .validator((data: unknown) => saleSchema.parse(data))
  .handler(async ({ data }) => {
    const mod = await import("@/lib/app-backend.server");
    return mod.createSale(data);
  });