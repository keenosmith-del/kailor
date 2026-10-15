import type { AnswerValue } from "../../../shared/src/index";
const prefix = "kailor:draft:";
const lifetime = 30 * 60 * 1000;
export function pruneDrafts() {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (!key.startsWith(prefix)) continue;
      try {
        const saved = JSON.parse(sessionStorage.getItem(key) ?? "{}");
        if (!saved.expiresAt || saved.expiresAt <= Date.now())
          sessionStorage.removeItem(key);
      } catch {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    /* Storage can be unavailable in a restricted browser. */
  }
}
export function readDraft(
  sessionId: string,
  revision: number,
  field: string,
): AnswerValue | undefined {
  try {
    pruneDrafts();
    const key = `${prefix}${sessionId}:${field}`;
    const saved = JSON.parse(sessionStorage.getItem(key) ?? "{}");
    if (saved.revision === revision && saved.expiresAt > Date.now())
      return saved.value;
    sessionStorage.removeItem(key);
  } catch {
    /* Optional local persistence never blocks discovery. */
  }
}
export function saveDraft(
  sessionId: string,
  revision: number,
  field: string,
  value: AnswerValue,
) {
  try {
    pruneDrafts();
    const key = `${prefix}${sessionId}:${field}`;
    if (!String(value).trim()) sessionStorage.removeItem(key);
    else
      sessionStorage.setItem(
        key,
        JSON.stringify({ revision, value, expiresAt: Date.now() + lifetime }),
      );
  } catch {
    /* Quota/private-mode fallback is an in-memory input. */
  }
}
export function clearDrafts(sessionId?: string) {
  try {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith(sessionId ? `${prefix}${sessionId}:` : prefix))
        sessionStorage.removeItem(key);
  } catch {
    /* Optional local persistence. */
  }
}
