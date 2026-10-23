import { expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import {
  createCareerRouter,
  careerAvailable,
  type CareerPolicy,
} from "../src/career-routes.js";
import { AppError } from "../src/errors.js";
import { CV_MAX_BYTES, cvSignatureError } from "../../shared/src/careers.js";
const policy: CareerPolicy = {
  enabled: true,
  reviewed: true,
  endpoint: "https://processor.example.invalid/intake",
  token: "isolated-test-only",
  processor: "Test processor",
  region: "Test region",
  retentionDays: 30,
};
function setup(
  overrides: Partial<CareerPolicy> = {},
  deliver = vi.fn<typeof fetch>(),
  limit = 20,
) {
  const app = express();
  app.use(
    "/api/careers",
    createCareerRouter(() => ({ ...policy, ...overrides }), deliver, limit),
  );
  app.use((error: any, _req: any, res: any, _next: any) =>
    res
      .status(error instanceof AppError ? error.status : error.status || 500)
      .json({ error: { message: error.message } }),
  );
  return { app, deliver };
}
function submission(app: express.Express) {
  return request(app)
    .post("/api/careers/introductions")
    .field("name", "Test Person")
    .field("email", "test@example.invalid")
    .field("phone", "")
    .field("location", "")
    .field("link1", "https://github.com/example")
    .field("link2", "")
    .field("message", "A private isolated test introduction.")
    .field("acknowledgement", "true")
    .field(
      "interests",
      JSON.stringify(["Software engineering", "AI & automation"]),
    );
}
const pdf = Buffer.from("%PDF-1.7\nIsolated test fixture\n%%EOF");
function receipt(scan = "clean", extra = {}) {
  return new Response(
    JSON.stringify({
      accepted: true,
      scan,
      private: true,
      retentionScheduled: true,
      receipt: "test-receipt",
      deleteBy: new Date(Date.now() + 86400000).toISOString(),
      ...extra,
    }),
    { status: 201 },
  );
}
it("defaults closed and does not invoke a processor for direct posts, including production misconfiguration", async () => {
  const { app, deliver } = setup({ enabled: false });
  expect((await request(app).get("/api/careers/policy")).body).toEqual({
    available: false,
  });
  await submission(app).attach("cv", pdf, "cv.pdf").expect(503);
  expect(deliver).not.toHaveBeenCalled();
  for (const p of [
    { reviewed: false },
    { token: "" },
    { endpoint: "http://processor.test" },
    { retentionDays: 0 },
    { processor: "" },
    { region: "" },
  ])
    expect(careerAvailable({ ...policy, ...p })).toBe(false);
});
it("confirms private scanned receipt and sends the actual bytes, interests, expiry and server credential", async () => {
  const { app, deliver } = setup();
  deliver.mockResolvedValue(receipt());
  await submission(app)
    .attach("cv", pdf, "cv.pdf")
    .expect(201, { received: true });
  const [url, options] = deliver.mock.calls[0];
  expect(url).toBe(policy.endpoint);
  expect(options?.headers).toMatchObject({
    Authorization: "Bearer isolated-test-only",
  });
  const body = options?.body as FormData;
  expect(Buffer.from(await (body.get("cv") as File).arrayBuffer())).toEqual(
    pdf,
  );
  const metadata = JSON.parse(String(body.get("application")));
  expect(metadata.interests).toHaveLength(2);
  expect(Date.parse(metadata.deleteBy)).toBeGreaterThan(Date.now());
  expect(options?.redirect).toBe("error");
});
it("permits an introduction without an optional CV with a matching confirmed receipt", async () => {
  const { app, deliver } = setup();
  deliver.mockResolvedValue(receipt("not_applicable"));
  await submission(app).expect(201);
});
it("rejects bogus signatures, unsupported and empty files without private delivery", async () => {
  const { app, deliver } = setup();
  for (const [name, bytes] of [
    ["cv.pdf", Buffer.from("fake")],
    ["cv.docx", Buffer.from("PK fake zip")],
    ["cv.doc", pdf],
    ["cv.pdf", Buffer.alloc(0)],
  ] as const)
    await submission(app).attach("cv", bytes, name).expect(400);
  expect(deliver).not.toHaveBeenCalled();
});
it("limits the multipart body while uploading and validates file-specific size", async () => {
  const { app, deliver } = setup();
  await submission(app)
    .attach("cv", Buffer.alloc(CV_MAX_BYTES + 1), "cv.pdf")
    .expect(400);
  await submission(app)
    .attach("cv", Buffer.alloc(CV_MAX_BYTES + 65537), "cv.pdf")
    .expect(413);
  expect(deliver).not.toHaveBeenCalled();
});
it("rejects duplicate/unexpected fields, missing acknowledgement, invalid email, unsafe URLs and interest injection", async () => {
  const { app, deliver } = setup();
  await submission(app).field("name", "Duplicate").expect(400);
  await submission(app).field("unknown", "x").expect(400);
  for (const [field, value] of [
    ["acknowledgement", "false"],
    ["email", "bad"],
    ["link1", "javascript:alert(1)"],
    ["interests", '["Invented"]'],
  ]) {
    let post = request(app).post("/api/careers/introductions");
    const fields = {
      name: "Test",
      email: "test@example.invalid",
      phone: "",
      location: "",
      link1: "",
      link2: "",
      message: "Test introduction",
      acknowledgement: "true",
      interests: "[]",
      [field]: value,
    };
    for (const [key, val] of Object.entries(fields))
      post = post.field(key, val);
    await post.expect(400);
  }
  expect(deliver).not.toHaveBeenCalled();
});
it("fails closed for rejected scanning, nonprivate or missing retention receipts and provider failure", async () => {
  for (const response of [
    receipt("infected"),
    receipt("clean", { private: false }),
    receipt("clean", { retentionScheduled: false }),
    receipt("clean", { deleteBy: "2100-01-01" }),
    new Response("failed", { status: 500 }),
  ]) {
    const { app, deliver } = setup();
    deliver.mockResolvedValue(response);
    await submission(app).attach("cv", pdf, "cv.pdf").expect(502);
  }
});
it("throttles direct submissions server-side", async () => {
  const { app, deliver } = setup({ enabled: false }, vi.fn(), 2);
  await submission(app).expect(503);
  await submission(app).expect(503);
  await submission(app).expect(429);
  expect(deliver).not.toHaveBeenCalled();
});
it("rejects truncated multipart uploads", async () => {
  const { app, deliver } = setup();
  await request(app)
    .post("/api/careers/introductions")
    .set("Content-Type", "multipart/form-data; boundary=test")
    .send("--test\r\ninvalid")
    .expect(400);
  expect(deliver).not.toHaveBeenCalled();
});
it("recognizes DOCX directory structure, rejects macros, encryption and archive bombs", () => {
  function zip(names: string[], size = 10, encrypted = false) {
    const locals: Buffer[] = [],
      dirs: Buffer[] = [];
    let offset = 0;
    for (const name of names) {
      const n = Buffer.from(name),
        l = Buffer.alloc(30 + n.length + 1);
      l.writeUInt32LE(0x04034b50);
      l.writeUInt16LE(n.length, 26);
      n.copy(l, 30);
      const d = Buffer.alloc(46 + n.length);
      d.writeUInt32LE(0x02014b50);
      d.writeUInt16LE(encrypted ? 1 : 0, 8);
      d.writeUInt32LE(1, 20);
      d.writeUInt32LE(size, 24);
      d.writeUInt16LE(n.length, 28);
      d.writeUInt32LE(offset, 42);
      n.copy(d, 46);
      locals.push(l);
      dirs.push(d);
      offset += l.length;
    }
    const directory = Buffer.concat(dirs),
      end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50);
    end.writeUInt16LE(names.length, 10);
    end.writeUInt32LE(directory.length, 12);
    end.writeUInt32LE(offset, 16);
    return Buffer.concat([...locals, directory, end]);
  }
  const names = ["[Content_Types].xml", "_rels/.rels", "word/document.xml"];
  expect(cvSignatureError("cv.docx", zip(names))).toBe("");
  for (const bytes of [
    zip(["fake.txt"]),
    zip([...names, "word/vbaProject.bin"]),
    zip(names, 30000000),
    zip(names, 10, true),
  ])
    expect(cvSignatureError("cv.docx", bytes)).not.toBe("");
});

it("validates actual DOCX XML before forwarding and deduplicates the processor key for identical retries", async () => {
  const { careerDocumentError } = await import("../src/career-documents.js");
  function archive(bad = false) {
    const entries = {
      "[Content_Types].xml":
        '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      "_rels/.rels": "<Relationships/>",
      "word/document.xml": bad
        ? "<!DOCTYPE foo><document/>"
        : '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>',
    };
    let offset = 0;
    const locals: Buffer[] = [],
      dirs: Buffer[] = [];
    for (const [name, xml] of Object.entries(entries)) {
      const n = Buffer.from(name),
        data = Buffer.from(xml),
        l = Buffer.alloc(30 + n.length);
      l.writeUInt32LE(0x04034b50);
      l.writeUInt32LE(data.length, 18);
      l.writeUInt32LE(data.length, 22);
      l.writeUInt16LE(n.length, 26);
      n.copy(l, 30);
      const d = Buffer.alloc(46 + n.length);
      d.writeUInt32LE(0x02014b50);
      d.writeUInt32LE(data.length, 20);
      d.writeUInt32LE(data.length, 24);
      d.writeUInt16LE(n.length, 28);
      d.writeUInt32LE(offset, 42);
      n.copy(d, 46);
      locals.push(l, data);
      dirs.push(d);
      offset += l.length + data.length;
    }
    const dir = Buffer.concat(dirs),
      end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50);
    end.writeUInt16LE(3, 10);
    end.writeUInt32LE(dir.length, 12);
    end.writeUInt32LE(offset, 16);
    return Buffer.concat([...locals, dir, end]);
  }
  expect(careerDocumentError("cv.docx", archive())).toBe("");
  expect(careerDocumentError("cv.docx", archive(true))).not.toBe("");
  const { app, deliver } = setup();
  deliver.mockImplementation(async () => receipt());
  await submission(app).attach("cv", archive(), "cv.docx").expect(201);
  await submission(app).attach("cv", archive(), "cv.docx").expect(201);
  expect(
    (deliver.mock.calls[0][1]?.headers as Record<string, string>)[
      "Idempotency-Key"
    ],
  ).toBe(
    (deliver.mock.calls[1][1]?.headers as Record<string, string>)[
      "Idempotency-Key"
    ],
  );
  await submission(app).attach("cv", archive(true), "cv.docx").expect(400);
});

it("bounds concurrent uploads and releases capacity after confirmed processing", async () => {
  const { app, deliver } = setup();
  const resolve: ((value: Response) => void)[] = [];
  deliver.mockImplementation(
    () => new Promise<Response>((done) => resolve.push(done)),
  );
  const first = submission(app).then((response) => response);
  const second = submission(app).then((response) => response);
  await vi.waitFor(() => expect(deliver).toHaveBeenCalledTimes(2));
  await submission(app).expect(503);
  for (const done of resolve) done(receipt("not_applicable"));
  expect((await first).status).toBe(201);
  expect((await second).status).toBe(201);
  deliver.mockResolvedValue(receipt("not_applicable"));
  await submission(app).expect(201);
});
