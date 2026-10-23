import express from "express";
import { careerDocumentError } from "./career-documents.js";
import rateLimit from "express-rate-limit";
import { createHmac } from "node:crypto";
import {
  CAREER_INTERESTS,
  CAREER_LIMITS,
  CV_MAX_BYTES,
  validateCareer,
  type CareerFields,
} from "../../shared/src/careers.js";
import { AppError } from "./errors.js";
export interface CareerPolicy {
  enabled: boolean;
  reviewed: boolean;
  endpoint: string;
  token: string;
  processor: string;
  region: string;
  retentionDays: number;
}
export function careerPolicy(): CareerPolicy {
  return {
    enabled: process.env.CAREERS_SUBMISSIONS === "enabled",
    reviewed: process.env.CAREERS_PRIVACY_REVIEWED === "true",
    endpoint: process.env.CAREERS_PROCESSOR_URL || "",
    token: process.env.CAREERS_PROCESSOR_TOKEN || "",
    processor: process.env.CAREERS_PROCESSOR_NAME || "",
    region: process.env.CAREERS_PROCESSING_REGION || "",
    retentionDays: Number(process.env.CAREERS_RETENTION_DAYS || 0),
  };
}
export function careerAvailable(p: CareerPolicy) {
  try {
    const url = new URL(p.endpoint);
    return (
      p.enabled &&
      p.reviewed &&
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      !!p.token &&
      !!p.processor &&
      !!p.region &&
      Number.isInteger(p.retentionDays) &&
      p.retentionDays > 0 &&
      p.retentionDays <= 365
    );
  } catch {
    return false;
  }
}
const unavailable = () =>
  new AppError(
    503,
    "careers_unavailable",
    "Online introductions are currently unavailable. Please email keenosmith@kailor.co.za.",
  );
// Injectable only for isolated contract tests. Production always uses server environment and fetch.
export function createCareerRouter(
  policy = careerPolicy,
  deliver: typeof fetch = fetch,
  limit = 5,
) {
  const router = express.Router();
  let active = 0;
  router.get("/policy", (_req, res) => {
    const p = policy(),
      available = careerAvailable(p);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      available,
      ...(available
        ? {
            processor: p.processor,
            region: p.region,
            retentionDays: p.retentionDays,
          }
        : {}),
    });
  });
  router.post(
    "/introductions",
    rateLimit({
      windowMs: 60 * 60_000,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: { message: "Too many introductions. Please try again later." },
      },
    }),
    (_req, _res, next) => {
      if (!careerAvailable(policy())) return next(unavailable());
      next();
    },
    (req, res, next) => {
      if (active >= 2)
        return next(
          new AppError(503, "careers_busy", "Please try again shortly."),
        );
      active++;
      const deadline = setTimeout(() => req.destroy(), 30_000);
      req.once("end", () => clearTimeout(deadline));
      let released = false;
      const release = () => {
        if (!released) {
          clearTimeout(deadline);
          active--;
          released = true;
        }
      };
      res.once("close", release);
      res.once("finish", release);
      req.setTimeout(30_000, () => req.destroy());
      next();
    },
    express.raw({
      type: "multipart/form-data",
      limit: CV_MAX_BYTES + 64 * 1024,
      inflate: false,
    }),
    async (req, res) => {
      const p = policy();
      if (!careerAvailable(p)) throw unavailable();
      if (!Buffer.isBuffer(req.body) || !req.is("multipart/form-data"))
        throw new AppError(
          400,
          "invalid_application",
          "Please submit the application form.",
        );
      let data: FormData;
      try {
        data = await new Request("https://local.invalid", {
          method: "POST",
          headers: { "Content-Type": req.headers["content-type"]! },
          body: new Uint8Array(req.body),
        }).formData();
      } catch {
        throw new AppError(
          400,
          "invalid_application",
          "The upload was incomplete. Please try again.",
        );
      }
      const allowed = [
        ...Object.keys(CAREER_LIMITS),
        "interests",
        "acknowledgement",
        "cv",
      ];
      for (const [key] of data)
        if (!allowed.includes(key) || data.getAll(key).length !== 1)
          throw new AppError(
            400,
            "invalid_application",
            "Please check your application.",
          );
      const fields = {} as CareerFields;
      for (const key of Object.keys(CAREER_LIMITS) as (keyof CareerFields)[]) {
        if (typeof data.get(key) !== "string")
          throw new AppError(
            400,
            "invalid_application",
            "Please check your application.",
          );
        fields[key] = String(data.get(key)).trim();
      }
      let interests: unknown;
      try {
        interests = JSON.parse(String(data.get("interests")));
      } catch {
        interests = null;
      }
      if (
        !Array.isArray(interests) ||
        interests.length > CAREER_INTERESTS.length ||
        new Set(interests).size !== interests.length ||
        interests.some((i) => !CAREER_INTERESTS.includes(i))
      )
        throw new AppError(
          400,
          "invalid_application",
          "Please check your interests.",
        );
      const errors = validateCareer(
        fields,
        data.get("acknowledgement") === "true",
      );
      if (Object.keys(errors).length)
        throw new AppError(
          400,
          "invalid_application",
          "Please check your application.",
        );
      const cv = data.get("cv");
      const digest = createHmac("sha256", p.token).update(
        JSON.stringify({ fields, interests }),
      );
      if (cv !== null) {
        if (typeof cv === "string" || cv.size > CV_MAX_BYTES)
          throw new AppError(
            400,
            "invalid_cv",
            "Choose a PDF or DOCX up to 5 MB.",
          );
        const bytes = Buffer.from(await cv.arrayBuffer());
        const error = careerDocumentError(cv.name, bytes);
        digest.update(bytes);
        if (error) throw new AppError(400, "invalid_cv", error);
      }
      const expiry = new Date(
        Date.now() + p.retentionDays * 86400_000,
      ).toISOString();
      const outbound = new FormData();
      outbound.set(
        "application",
        JSON.stringify({
          ...fields,
          interests,
          acknowledgement: {
            version: "careers-v1",
            at: new Date().toISOString(),
          },
          deleteBy: expiry,
        }),
      );
      if (cv && typeof cv !== "string")
        outbound.set(
          "cv",
          new Blob([await cv.arrayBuffer()], {
            type: /\.pdf$/i.test(cv.name)
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
          cv.name,
        );
      // Processor must quarantine, scan, privately accept and schedule deletion before confirming.
      // No local storage, public document URL, content logging or automatic retry.
      const controller = new AbortController();
      req.once("aborted", () => controller.abort());
      res.once("close", () => {
        if (!res.writableEnded) controller.abort();
      });
      const timer = setTimeout(() => controller.abort(), 20_000);
      try {
        const receipt = await deliver(p.endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${p.token}`,
            "Idempotency-Key": digest.digest("hex"),
          },
          body: outbound,
          redirect: "error",
          signal: controller.signal,
        });
        if (
          !receipt.ok ||
          Number(receipt.headers.get("content-length") || 0) > 8192
        )
          throw new Error();
        // Bound even a chunked provider response.
        const reader = receipt.body?.getReader();
        let text = "",
          length = 0;
        if (!reader) throw new Error();
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          length += chunk.value.length;
          if (length > 8192) {
            await reader.cancel();
            throw new Error();
          }
          text += new TextDecoder().decode(chunk.value);
        }
        const result = JSON.parse(text);
        const deletion = Date.parse(result.deleteBy);
        if (
          result.accepted !== true ||
          result.scan !== (cv ? "clean" : "not_applicable") ||
          result.private !== true ||
          result.retentionScheduled !== true ||
          typeof result.receipt !== "string" ||
          !/^[a-zA-Z0-9_-]{1,120}$/.test(result.receipt) ||
          !Number.isFinite(deletion) ||
          deletion > Date.parse(expiry) ||
          deletion <= Date.now()
        )
          throw new Error();
        res.status(201).json({ received: true });
      } catch {
        throw new AppError(
          502,
          "delivery_failed",
          "Your introduction could not be confirmed. Your form has been kept. Please retry or email keenosmith@kailor.co.za.",
        );
      } finally {
        clearTimeout(timer);
        req.body = undefined;
      }
    },
  );
  return router;
}
