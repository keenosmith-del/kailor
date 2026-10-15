import { config as dotenv } from "dotenv";
import { resolve, basename } from "node:path";
import { z } from "zod";
dotenv({
  path: resolve(
    process.cwd(),
    basename(process.cwd()) === "backend" ? "../.env" : ".env",
  ),
  quiet: true,
});
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .default("postgresql://kailor:kailor_local@localhost:5432/kailor"),
  PORT: z.coerce.number().int().default(5050),
  HOST: z.string().default("127.0.0.1"),
  APP_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
  NODE_ENV: z.string().default("development"),
  ADMIN_EMAIL: z.email().default("founder@kailor.local"),
  ADMIN_PASSWORD: z.string().default(""),
  AI_PROVIDER: z.enum(["mock", "cloudflare"]).default("mock"),
  AI_ALLOW_REMOTE: z.enum(["true", "false"]).default("false"),
  CLOUDFLARE_ACCOUNT_ID: z.string().default(""),
  CLOUDFLARE_API_TOKEN: z.string().default(""),
  CLOUDFLARE_MODEL: z.string().default("@cf/meta/llama-3.1-8b-instruct"),
  AI_MAX_CALLS_PER_SESSION: z.coerce.number().int().min(0).max(100).default(5),
  AI_MAX_CALLS_PER_DAY: z.coerce.number().int().min(0).max(1000).default(20),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(128).max(2048).default(600),
  AI_CONTEXT_RECENT_MESSAGES: z.coerce
    .number()
    .int()
    .min(2)
    .max(30)
    .default(12),
  AI_CONTEXT_MAX_CHARACTERS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(24000)
    .default(12000),
  AI_TIMEOUT_MS: z.coerce.number().int().min(100).max(60000).default(15000),
  ESTIMATE_CURRENCY: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default("ZAR"),
  ESTIMATE_HOURLY_RATE: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().positive().optional(),
  ),
});
export const config = envSchema.parse(process.env);
export const logger = {
  info: (event: string, data: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ level: "info", event, ...data })),
  error: (event: string, data: Record<string, unknown> = {}) =>
    console.error(JSON.stringify({ level: "error", event, ...data })),
};
