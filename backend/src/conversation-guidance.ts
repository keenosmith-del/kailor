import { consultingBrief } from "./consulting.js";
import { customerReport } from "../../shared/src/report.js";
import type { Report } from "../../shared/src/index.js";
import { resolveOption, type Turn } from "./conversation-context.js";
import type {
  Answers,
  ChatOutput,
  DiscoveryPlan,
  Recommendation,
} from "../../shared/src/index.js";
import { evaluateInput } from "./input-quality.js";
import { planDiscovery } from "./discovery-planner.js";
import { claimsFromText } from "./knowledge-conflicts.js";
import { recommend } from "./assessment.js";
export function localReply(
  context: Answers,
  message: string,
  proposals: ChatOutput["proposals"],
  mode = "conversation",
  savedPlan?: DiscoveryPlan,
  suppliedRecommendations?: Recommendation[],
  history: Turn[] = [],
  suppliedReport?: Report,
  liveConsulting?: import("../../shared/src/consulting.js").ConsultingBrief,
) {
  const quality = evaluateInput(message, "", "chat"),
    plan = savedPlan ?? planDiscovery(context);
  const text = message.trim();
  const brief =
    suppliedReport?.consulting ?? liveConsulting ?? consultingBrief(context);
  if (
    brief.facts.length &&
    /summari[sz].*(?:learn|situation|told|know)|(?:what|everything).*(?:learned|know about me|told you)/i.test(
      text,
    )
  )
    return `You reported:\n${brief.facts.map((f) => `${f.label}: ${f.quote}`).join("\n")}\n\nSupported interpretation: ${brief.conclusions.join(" ") || "There is not enough information to favour a direction yet."}\n\nStill unverified: ${brief.hypotheses.join(" ")}\n\nOpen questions: ${brief.unknowns.join(" ")}`;
  if (
    brief.directions.some((d) => d.basis.length) &&
    /explain|compar|direction|experiment|cost|learn|summari[sz]|what.*fit|recommend|next step/i.test(
      text,
    ) &&
    (context.stage === "uncertain" ||
      suppliedReport?.assessmentType === "exploration")
  ) {
    const available = brief.directions.filter(
      (d) => !["rejected", "deferred"].includes(d.status),
    );
    const selected =
      available.find(
        (d) =>
          text.toLowerCase().includes(d.title.toLowerCase()) ||
          text.toLowerCase().includes(d.id.replaceAll("-", " ")) ||
          text.toLowerCase().includes(d.id),
      ) ?? available[0];
    if (selected)
      return `${brief.summary}\n\n${(/compar/i.test(text) ? available : [selected]).map((d) => `${d.title}: ${d.summary} ${d.why}`).join("\n\n")}\n\nFor a first test: ${selected.firstStep} ${selected.costToTest} ${/cost|price|paid|experiment|test/i.test(text) ? selected.validation.map((v) => `${v.kind}: ${v.action}`).join(" ") : (selected.validation.find((v) => v.kind === "Willingness to pay")?.action ?? selected.validation[0].action)}\n\n${selected.risks.join(" ")} ${/compar/i.test(text) ? "Which direction would you like to test first?" : "Who would you try this with first?"}`;
  }
  if (
    suppliedReport &&
    /explain|summari[sz]|assess|report|analysis/i.test(text) &&
    suppliedReport.assessmentType === "exploration"
  ) {
    const report = customerReport(suppliedReport);
    return `This saved report is an exploration profile, rather than a plan for an established business. ${report.sections.find((s) => s.title === "Your starting point")?.paragraphs.join(" ") ?? "Your starting preferences remain open."}\n\nThe possibilities are examples to test, not validated demand or promises of income. A small conversation, sketch or manual trial can help you learn before committing money. Which possibility would you like to try first?`;
  }

  if (
    /no business idea|don.t have (?:a |any )?(?:business|idea)|explore possible opportunit|explore possible (?:business )?directions|what might fit my interests|starting from nothing/i.test(
      text,
    ) ||
    (context.stage === "uncertain" &&
      /explor|direction|start|experiment/i.test(text))
  )
    return "You don’t need an idea yet. We can explore small service, product or sharing experiments without treating them as proven opportunities. Start by noticing a task someone struggles with, or something you enjoy learning. There is no need to commit money before testing interest.\n\nWould you rather help someone, make something, or explore examples first?";
  if (
    /book|appointment|scheduling/i.test(text) &&
    /explain|how|website|cost|price|should|compare|build/i.test(text)
  )
    return "A hosted booking page gives customers a link to view availability and request or confirm an appointment, depending on the service. You can share that link through Instagram and WhatsApp Business without building a full website. A website may be useful later if you need more information or a separate presence.\n\nCheck whether a provider supports your appointment types, calendar, reminders and cancellation rules. Reminders may use email, SMS or other supported channels; WhatsApp automation is not assumed. Compare subscription fees, message charges and any payment fees before choosing. Custom software adds development and maintenance work and needs a clear gap in existing tools.\n\nWould you prefer customers to confirm a time directly, or send a request for you to approve?";

  if (
    /would I need to learn|do I need to (?:learn|code)|need.*web development/i.test(
      text,
    )
  )
    return "You may be able to start with a website builder or an existing portfolio tool without learning web development. Custom design or unusual integrations may need development help. How much would you like to maintain yourself?";
  if (
    /would (?:that|it) be cheaper|prefer the previous idea|go back to the (?:previous|earlier) idea/i.test(
      text,
    )
  )
    return "Which approach are you referring to? I can compare the earlier options once we identify it, without inventing a price.";
  if (/integrate it with|connect it to what/i.test(text))
    return `Integration depends on the product's APIs, permissions and data export support.${context.tools ? ` Your confirmed tools are ${String(context.tools)}.` : ""} Which tool or connection should we check first?`;
  const reference = resolveOption(text, history);
  if (reference)
    return reference.option
      ? `The ${reference.ordinal} option was: ${reference.option}\n\n${/cheap|cost|price/i.test(text) ? "An existing service or smaller website often involves less custom development, but there is no approved price comparison yet. We need scope and recurring fees to compare fairly." : "We would define the essential workflow, check existing tools against it, then identify any configuration or custom work. Which capability should we examine first?"}`
      : "Which two approaches are you referring to? I do not have a clearly numbered comparison in the recent conversation.";
  if (
    /website or (?:an? )?app|website (?:rather than|instead of|versus|vs) (?:a )?(?:mobile )?app/i.test(
      text,
    )
  )
    return "1. A website: a proportionate starting point for presenting products or work and receiving enquiries. Existing booking tools can be linked where relevant.\n2. A mobile application: worth exploring when users need repeat interactions, device features or offline workflows. It adds development and maintenance work.\n\nWhat should people be able to do? These are alternatives to explore, not confirmed scope or priced recommendations.";
  if (
    /compare|existing booking tool be enough|cheapest approach|explore existing tools/i.test(
      text,
    )
  ) {
    const recommendations = suppliedRecommendations ?? recommend(context);
    if (
      /booking/i.test(text) &&
      recommendations.some((r) => r.serviceId === "booking")
    )
      return "1. An existing booking service linked from your public presence: customers can choose available times, subject to checking the provider's features, fees and data portability.\n2. Keep WhatsApp enquiries with a clearer catalogue and booking process: less change, but you still manage availability manually.\n\nBoth could support your confirmed booking objective. Which would fit how you want customers to contact you? Pricing and integration details still need review.";
    if (!recommendations.length)
      return "We can compare approaches once your goal and current workflow are clearer. What should the solution help someone do?";
    return (
      recommendations
        .slice(0, 2)
        .map(
          (r, i) =>
            `${i + 1}. ${r.solution}: ${r.alternatives.slice(0, 2).join(" ")}`,
        )
        .join("\n") +
      "\n\nThese directions come from your confirmed context. Costs need defined scope and vendor fees; no approved price comparison is available yet."
    );
  }
  if (/how are you/i.test(text))
    return "I'm here and ready to help. What are you thinking of building or improving?";
  if (
    /thinking about.*(?:portfolio|business)|don't know what.*looking for|help me (?:figure|work) it out/i.test(
      text,
    )
  )
    return "We can explore it together. Are you creating something new or improving something you already do?";
  if (/can you explain what you understood/i.test(text))
    return plan.context.pending.length
      ? `These are proposed details from your messages: ${plan.context.pending.map((p) => `${p.key}: ${Array.isArray(p.value) ? p.value.join(", ") : p.value}`).join("; ")}. Confirm, edit or dismiss them before they become assessment evidence.`
      : "There are no pending details. We can discuss your confirmed context or explore alternatives.";
  if (
    /summari[sz]e|what.*understood|where were we|what (?:do you know|have we decided|is still missing)|did I tell you/i.test(
      text,
    )
  ) {
    if (/website/i.test(text)) {
      const current =
        plan.context.corrections.find((c) => c.facet === "website")
          ?.currentValue ?? context.websiteStatus;
      if (current && current !== "unknown")
        return `Your confirmed current website status is ${current === "existing" ? "an existing website" : "no current website"}.${plan.context.corrections.some((c) => c.facet === "website") ? " The earlier status is historical after your confirmed correction." : ""} You can propose a correction here if this has changed.`;
    }
    const descriptions = [
      ...new Set(
        (plan.context.statements ?? [])
          .filter(
            (s) =>
              s.status === "confirmed-description" &&
              ![
                "stage",
                "kind",
                "websiteStatus",
                "bookingStatus",
                "websitePreference",
                "appPreference",
                "aiPreference",
                "automationPreference",
              ].includes(s.sourceKey),
          )
          .map((s) => s.text),
      ),
    ].slice(0, 4);
    if (!descriptions.length && !plan.context.facts.length)
      return "We have not confirmed a situation yet. What are you working on?";
    return `Confirmed for this plan: ${
      descriptions.length
        ? descriptions.join(" ")
        : plan.context.facts
            .slice(0, 4)
            .map((f) => `${f.key}: ${f.value}`)
            .join("; ")
    }\n\n${plan.context.pending.length ? `${plan.context.pending.length} proposed details still need confirmation. ` : ""}${plan.readiness.canAssess ? "You can prepare an initial assessment or continue exploring." : (plan.question?.title ?? "We still need a concrete situation and objective.")}`;
  }
  if (/explain.*(?:assessment|report|analysis)/i.test(text) && suppliedReport) {
    const report = customerReport(suppliedReport);
    return `${report.title}. ${report.sections[0]?.paragraphs.join(" ") ?? "This is a preliminary assessment."}\n\n${report.recommendations
      .slice(0, 2)
      .map((r) => `${r.solution}: ${r.problem}`)
      .join(
        " ",
      )} Costs and provider compatibility still need to be checked. Which part would you like to look at more closely?`;
  }
  if (/why.*recommend|explain.*recommendation/i.test(text)) {
    const recommendation = suppliedRecommendations?.[0];
    return recommendation
      ? `${recommendation.solution}: ${recommendation.problem}\n\nAlternatives to consider: ${recommendation.alternatives.slice(0, 2).join(" ")}. This is based on confirmed discovery evidence; final scope and pricing still require review.`
      : "There is no evidence-backed recommendation yet. We can compare approaches once your goal and workflow are clearer.";
  }
  if (/prepare.*assessment|ready.*assess/i.test(text))
    return plan.readiness.canAssess
      ? "I have enough information to prepare an initial assessment. Use Prepare assessment below when you are ready."
      : `We still need to clarify the assessment evidence. ${plan.question?.title ?? plan.readiness.reasons.join(". ")}`;
  if (
    /too expensive|can.t afford|cost too much|start with something smaller|smaller version/i.test(
      text,
    )
  )
    return "We can narrow the first step and compare existing tools before custom work. Which outcome matters most, and what should we defer? Confirm any revised scope before I update it.";
  if (
    /keep using|replac.*(?:tool|software)|existing tool.*easier|current provider/i.test(
      text,
    )
  )
    return `Keeping useful software is a good option to investigate. ${plan.question?.id === "bookingCapabilities" ? plan.question.title : "Which capability is missing from the current tool, and does it support configuration or integration?"}`;
  if (
    /what if|would.*offline|offline.*tradeoff|tradeoffs?.*offline/i.test(text)
  )
    return "Offline use needs local storage, synchronization and a way to resolve conflicting edits. This is a possibility until you confirm it; which tasks would need to work without a connection?";
  if (
    /actually|instead|no longer|anymore|might be enough/i.test(text) &&
    /app|website|scope/i.test(text)
  )
    return proposals.length
      ? "That could change the scope. Review and confirm the proposed change below before I replace the earlier requirement."
      : "Are you choosing a simpler website as the new scope, or comparing it with the application? Tell me the essential functionality before confirming a replacement.";
  if (
    /what do you mean|explain (?:that|the previous|your last)|earlier answer/i.test(
      text,
    )
  )
    return (
      plan.question?.hint ??
      `Your saved objective is ${String(context.goals ?? context.request ?? "still being clarified")}. ${plan.readiness.reasons.join(". ")}`
    );
  if (/^(?:yes|that one|confirm it|go ahead)[.!]*$/i.test(text))
    return plan.context.pending.length
      ? "Use Confirm on the proposed details below so I update the exact fields you reviewed."
      : "Which option or requirement are you choosing? I will show the proposed update before saving it as confirmed knowledge.";
  const claims = claimsFromText(text, "chat");
  if (
    claims.some((c) =>
      claims.some((x) => x.facet === c.facet && x.value !== c.value),
    )
  )
    return "I heard conflicting statements. Could you clarify which describes your current situation or preference?";
  if (!quality.usableFacts) {
    if (/^(hi|hello|hey|good morning|good afternoon)[.!]*$/i.test(text))
      return plan.context.activity
        ? "Hi. I have your saved context. Would you like to clarify a next step or correct an earlier answer?"
        : "Hi. kailor helps you work out useful technology or workflow changes. What are you working on?";
    if (/^(thanks(?:,? that makes sense)?|thank you)[.!]*$/i.test(text))
      return "You're welcome. We can keep exploring or prepare an assessment when there is enough confirmed information.";
    if (/changed my mind/i.test(text))
      return "Which requirement or preference would you like to change? I'll ask you to confirm the updated information.";
    if (/explain|what do you mean/i.test(text))
      return plan.question?.hint ?? plan.readiness.reasons.join(". ");
    return quality.explanation;
  }
  if (proposals.length) {
    const labels: Record<string, string> = {
      industry: "activity",
      goals: "objectives",
      request: "requested scope",
      constraints: "constraints",
      tools: "current tools",
      presence: "current channels",
      problems: "workflow problems",
      aiPreference: "AI preference",
      appPreference: "application scope",
      websitePreference: "website preference",
    };
    const topics = [
      ...new Set(proposals.map((p) => labels[p.key] ?? "requirements")),
    ].slice(0, 3);
    const followUp =
      /bookings? (?:through|via)|take bookings/i.test(text) && !context.goals
        ? "What would you most like to improve about how customers find you or book?"
        : /look more professional|bookings? easier/i.test(text)
          ? "If confirmed, a simple portfolio website and an existing booking service are worth comparing before custom development. Would you prefer customers to book a time directly, or contact you first?"
          : plan.question?.title;
    return `Thanks — that helps clarify your ${topics.join(", ")}. You can review the suggested project details below when ready.${followUp ? `\n\n${followUp}` : ""}`;
  }
  if (mode === "analysis") {
    const approaches = (suppliedRecommendations ?? recommend(context))
      .slice(0, 2)
      .map((r) => `${r.solution}: ${r.alternatives.slice(0, 2).join(". ")}`)
      .join(" ");
    if (approaches) return approaches;
  }
  return (
    plan.question?.title ??
    (plan.readiness.canAssess
      ? "There is enough evidence for a qualified preliminary assessment. Prepare it when you are ready."
      : "What is one real task, difficulty or intended outcome we should investigate?")
  );
}
export function containsSensitiveData(text: string) {
  return /\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b|\b(?:sk-|Bearer\s+)[a-z0-9_-]{12,}|\b(?:patient name|national id|credit card number|passport number)\s*[:=]|\b\+?\d[\d ()-]{9,}\d\b/i.test(
    text,
  );
}
