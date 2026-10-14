import type {
  Answers,
  AnswerStates,
  InputQuality,
} from "../../shared/src/index.js";
const choiceKeys = new Set([
  "stage",
  "kind",
  "presence",
  "problems",
  "websiteStatus",
  "bookingStatus",
  "aiPreference",
  "automationPreference",
  "websitePreference",
  "appPreference",
]);
const uncertain =
  /^(?:i |we )?(?:don['’]?t know(?: (?:what i want|yet))?|do not know(?: what i want)?|not sure(?: yet)?|unsure|unknown|not established|not defined|not decided|no idea|i have no idea|not sure what i want|still exploring|i['’]?m still exploring|help me work this out|i don['’]?t know what i want yet)[.!?]*$/i;
export function isUncertain(value: string) {
  return uncertain.test(value.trim());
}
export function evaluateInput(
  value: unknown,
  key = "",
  mode: "guided" | "chat" | "proposal" = "guided",
): InputQuality {
  const make = (
    disposition: InputQuality["disposition"],
    issues: string[],
    explanation: string,
    accepted: boolean,
    usableFacts: boolean,
    recovery: InputQuality["recovery"],
  ): InputQuality => ({
    disposition,
    issues,
    explanation,
    accepted,
    usableFacts,
    clarificationRequired: [
      "accepted_incomplete",
      "clarification_required",
    ].includes(disposition),
    recovery,
  });
  if (Array.isArray(value))
    return make("accepted", [], "Selection recorded", true, true, "continue");
  if (typeof value !== "string" || !value.trim())
    return make(
      "rejected_invalid",
      ["empty"],
      "Please describe what you are working on or what you want to improve.",
      false,
      false,
      "correct_input",
    );
  if (choiceKeys.has(key))
    return make("accepted", [], "Selection recorded", true, true, "continue");
  const text = value.trim(),
    normalized = text
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim(),
    tokens = normalized.split(/\s+/u);
  if (
    /^(?:lorem ipsum(?: dolor|$)|the quick brown fox jumps over)\b/i.test(
      text,
    ) ||
    /^(?:placeholder|sample text|dummy text|test input)[.!]*$/i.test(text)
  )
    return make(
      "rejected_placeholder",
      ["placeholder"],
      "This looks like placeholder text. A real activity, difficulty or intended outcome will help me ask a useful question.",
      false,
      false,
      "correct_input",
    );
  const blocks = text
    .split(/\n+|(?<=[.!])\s+/u)
    .map((s) => s.trim().toLocaleLowerCase())
    .filter(Boolean);
  const repeatedBlocks = blocks.length >= 3 && new Set(blocks).size === 1;
  if (
    (tokens.length >= 4 && new Set(tokens).size <= 2) ||
    repeatedBlocks ||
    /^(.)\1{7,}$/u.test(normalized)
  )
    return make(
      "rejected_placeholder",
      ["repetition"],
      "I couldn't identify useful details in the repeated text. Could you describe one real situation or difficulty?",
      false,
      false,
      "correct_input",
    );
  if (!/[\p{L}\p{N}]/u.test(text))
    return make(
      "accepted_incomplete",
      ["symbols_without_context"],
      "Could you add a short description of what you are working on?",
      true,
      false,
      "clarify",
    );
  // Known keyboard runs only. No dictionary, vowel or language blacklist.
  if (
    tokens.every((t) => /^(?:asdf\w*|qwerty\w*|zxcv\w*|blah|foo|bar)$/i.test(t))
  )
    return make(
      "rejected_placeholder",
      ["keyboard_or_filler"],
      "I couldn't identify a situation or requirement from that. Please describe what you are working on.",
      false,
      false,
      "correct_input",
    );
  if (/^\d[\d\s.,]*$/.test(text) && !["budget", "timing"].includes(key))
    return make(
      "rejected_invalid",
      ["number_without_context"],
      "Please add what that number describes so I can understand its relevance.",
      false,
      false,
      "correct_input",
    );
  if (
    /(?:^|[.!?]\s+|\n)(?:ignore (?:all |the )?(?:previous|prior|above) instructions|(?:reveal|tell me|print) (?:your |the )?system prompt|<\/?(?:system|script|assistant)\b)/i.test(
      text,
    )
  )
    return make(
      "rejected_invalid",
      ["instruction_attempt"],
      "I can help clarify technology needs, but cannot follow instructions to change my role or expose private configuration.",
      false,
      false,
      "return_to_discovery",
    );
  if (isUncertain(text) || /^not applicable[.!]*$/i.test(text))
    return make(
      "accepted_incomplete",
      ["uncertain_or_irrelevant"],
      "That is fine. It records uncertainty or relevance, rather than a business requirement.",
      true,
      false,
      "clarify",
    );
  if (
    /^(?:hi|hello|hey|thanks(?:,? that makes sense)?|thank you|good (?:morning|afternoon)|can you explain that|what do you mean|i changed my mind)[.!?]*$/i.test(
      text,
    )
  )
    return make(
      mode === "chat" ? "accepted_incomplete" : "clarification_required",
      ["conversational_turn"],
      "Let's work out what you want to change or build.",
      mode === "chat",
      false,
      "clarify",
    );
  if (
    /^(?:(?:I (?:want|need) (?:you to )?)?write (?:me )?(?:a )?poem|what['’]?s the weather|what is the weather|who won|what is the capital|tell me a joke)/i.test(
      text,
    )
  )
    return make(
      "off_topic",
      ["outside_discovery"],
      "kailor helps investigate technology, products and workflows. Tell me what you would like to build or improve.",
      mode === "chat",
      false,
      "return_to_discovery",
    );
  if (
    /^(?:i |we )?(?:just )?(?:want|need)(?: to)? (?:something (?:better|useful)|improve (?:my|our) (?:work|business|life)|help)[.!]*$/i.test(
      text,
    )
  )
    return make(
      "accepted_incomplete",
      ["vague_outcome"],
      "What would you most like to change: how people find you, how you work, or something you are planning to build?",
      true,
      false,
      "clarify",
    );
  if (
    /\b(?:might|maybe|what if|hypothetically|used to|thinking about|whether|if i had)\b/i.test(
      text,
    )
  )
    return make(
      "accepted_incomplete",
      ["tentative_or_historical"],
      "I will distinguish what exists today from possibilities. What is the current situation and desired change?",
      true,
      /\b(?:I run|I am|I coordinate|already|manually|I use|we use)\b/i.test(
        text,
      ),
      "clarify",
    );
  return make(
    "accepted",
    [],
    "Useful information recorded; further details may still be needed.",
    true,
    true,
    "continue",
  );
}
export function usableAnswers(a: Answers, states: AnswerStates = {}): Answers {
  return Object.fromEntries(
    Object.entries(a).filter(
      ([key, value]) =>
        (!states[key] || states[key] === "answered") &&
        evaluateInput(value, key).usableFacts,
    ),
  );
}
export function inferResponseState(
  value: unknown,
  skipped = false,
): "answered" | "unknown" | "not_applicable" | "skipped" {
  if (skipped) return "skipped";
  if (typeof value === "string" && /^not applicable[.!]*$/i.test(value.trim()))
    return "not_applicable";
  if (typeof value === "string" && isUncertain(value)) return "unknown";
  return "answered";
}
