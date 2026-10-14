import type { Answers, ContextDimension } from "../../shared/src/index.js";
export type IntelligenceCase = {
  id: string;
  situation: string;
  desiredOutcome: string;
  confirmedFacts: Answers;
  unverifiedDetails: string[];
  usefulFollowUpDimensions: string[];
  unacceptableAssumptions: string[];
  solutionCategories: string[];
  readiness: boolean;
  retrievalRelevant: boolean;
  dimensions: ContextDimension[];
};
// Manually labelled needs. Acceptance checks categories/gaps, never copied reply wording.
export const intelligenceCases: IntelligenceCase[] = [
  {
    id: "agricultural-field-work",
    situation:
      "I inspect agricultural machinery and want technicians to record service work from their phones, including places where they have no internet connection.",
    desiredOutcome: "Capture service records offline",
    confirmedFacts: {
      stage: "specific",
      request:
        "I inspect agricultural machinery and want technicians to record service work from their phones, including places where they have no internet connection.",
    },
    unverifiedDetails: ["record structure", "roles", "sync conflict policy"],
    usefulFollowUpDimensions: [
      "offlineDetails",
      "dataCaptureDetails",
      "accessDetails",
      "reportingDetails",
    ],
    unacceptableAssumptions: ["portfolio", "booking", "publishing", "ai"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: false,
    dimensions: ["offline", "data_capture", "collaboration"],
  },
  {
    id: "factory-quality",
    situation:
      "Operators inspect batches on paper and supervisors sign off defects.",
    desiredOutcome: "Capture and review quality checks",
    confirmedFacts: {
      stage: "established",
      industry: "Manufacturing quality team",
      goals:
        "Record batch inspections and supervisor approvals using shared tablets",
    },
    unverifiedDetails: ["approval roles", "fields"],
    usefulFollowUpDimensions: ["dataCaptureDetails", "reportingDetails"],
    unacceptableAssumptions: ["website", "booking", "ai"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: false,
    dimensions: ["data_capture", "approvals"],
  },
  {
    id: "fleet-workshop",
    situation: "Mechanics log repairs on paper",
    desiredOutcome: "Track maintenance",
    confirmedFacts: {
      stage: "established",
      industry: "A regional fleet workshop",
      goals:
        "Record repairs and maintenance for vehicles and export weekly manager reports",
    },
    unverifiedDetails: ["record fields"],
    usefulFollowUpDimensions: ["dataCaptureDetails"],
    unacceptableAssumptions: ["portfolio", "ai"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: false,
    dimensions: ["data_capture", "reporting"],
  },
  {
    id: "property-access",
    situation: "Rental staff share spreadsheets",
    desiredOutcome: "Capture approvals",
    confirmedFacts: {
      stage: "established",
      industry: "Property managers",
      goals: "Record maintenance requests with staff approval and reporting",
    },
    unverifiedDetails: ["roles", "records"],
    usefulFollowUpDimensions: ["accessDetails", "dataCaptureDetails"],
    unacceptableAssumptions: ["booking", "website"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: false,
    dimensions: ["collaboration", "approvals"],
  },
  {
    id: "health-admin",
    situation: "Clinic reception manages appointments manually",
    desiredOutcome: "Improve appointment reminders",
    confirmedFacts: {
      stage: "established",
      industry: "Healthcare administration",
      bookingDetails: "Appointments through WhatsApp cause missed reminders",
      goals: "Reduce missed appointments",
      bookingStatus: "existing",
    },
    unverifiedDetails: [
      "provider reminder settings",
      "sensitive data handling",
    ],
    usefulFollowUpDimensions: ["bookingCapabilities"],
    unacceptableAssumptions: ["website", "webapp", "ai"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: true,
    dimensions: ["scheduling", "communication"],
  },
  {
    id: "event-team",
    situation: "Volunteers collect attendance on paper",
    desiredOutcome: "Record attendance",
    confirmedFacts: {
      stage: "established",
      industry: "Event organizers",
      goals: "Record volunteer attendance and export weekly manager reports",
    },
    unverifiedDetails: ["access", "capture fields"],
    usefulFollowUpDimensions: ["accessDetails", "dataCaptureDetails"],
    unacceptableAssumptions: ["portfolio", "booking"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: false,
    dimensions: ["data_capture", "collaboration"],
  },
  {
    id: "construction",
    situation: "Site inspections use paper",
    desiredOutcome: "Capture records offline",
    confirmedFacts: {
      stage: "specific",
      request:
        "Record construction inspections offline for site staff using phones",
    },
    unverifiedDetails: ["sync", "record retention"],
    usefulFollowUpDimensions: ["offlineDetails"],
    unacceptableAssumptions: ["website", "booking"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: false,
    dimensions: ["offline", "data_capture"],
  },
  {
    id: "nonprofit",
    situation: "Volunteers duplicate weekly reporting",
    desiredOutcome: "Record and report donations",
    confirmedFacts: {
      stage: "established",
      industry: "Nonprofit team",
      goals: "Record donation receipts with volunteer approvals and reporting",
    },
    unverifiedDetails: ["roles", "data retention"],
    usefulFollowUpDimensions: ["accessDetails", "reportingDetails"],
    unacceptableAssumptions: ["booking", "portfolio"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: false,
    dimensions: ["data_capture", "collaboration", "reporting"],
  },
  {
    id: "education-admin",
    situation: "Teachers collect forms on paper",
    desiredOutcome: "Reduce lost approval records",
    confirmedFacts: {
      stage: "established",
      industry: "An independent school",
      goals: "Record teacher approval forms and track missing records",
    },
    unverifiedDetails: ["access", "retention"],
    usefulFollowUpDimensions: ["accessDetails", "reportingDetails"],
    unacceptableAssumptions: ["publishing", "ai", "booking"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: false,
    dimensions: ["data_capture", "collaboration", "approvals"],
  },
  {
    id: "consultancy-multi-goal",
    situation: "A consultant needs presentation and invoice changes",
    desiredOutcome: "Two separate outcomes",
    confirmedFacts: {
      stage: "established",
      kind: "professional",
      industry: "Independent consultant",
      goals: "I want a portfolio and invoice automation",
      invoiceDetails: "I manually copy project totals into invoices every week",
      constraints: "Limited budget",
    },
    unverifiedDetails: ["content", "accounting integration"],
    usefulFollowUpDimensions: ["websiteContent"],
    unacceptableAssumptions: ["booking", "webapp", "ai"],
    solutionCategories: ["portfolio", "automation"],
    readiness: true,
    retrievalRelevant: true,
    dimensions: ["presentation", "automation"],
  },
  {
    id: "personal-productivity",
    situation: "An individual tracks tasks manually",
    desiredOutcome: "Capture task progress",
    confirmedFacts: {
      stage: "established",
      industry: "Personal projects",
      workflowDetails:
        "I record project tasks in notebooks and need a weekly progress report",
    },
    unverifiedDetails: ["current alternatives"],
    usefulFollowUpDimensions: ["dataCaptureDetails", "reportingDetails"],
    unacceptableAssumptions: ["website", "booking", "ai"],
    solutionCategories: ["integration"],
    readiness: true,
    retrievalRelevant: false,
    dimensions: ["data_capture", "reporting"],
  },
  {
    id: "undefined-technical-term",
    situation: "A founder asks for a platform",
    desiredOutcome: "Not established",
    confirmedFacts: { stage: "specific", request: "I want a platform" },
    unverifiedDetails: ["users", "essential functions", "outcome"],
    usefulFollowUpDimensions: [],
    unacceptableAssumptions: ["webapp", "ai", "website"],
    solutionCategories: [],
    readiness: false,
    retrievalRelevant: false,
    dimensions: [],
  },
  {
    id: "hypothetical-offline",
    situation: "A photographer considers offline",
    desiredOutcome: "Portfolio",
    confirmedFacts: {
      stage: "established",
      kind: "professional",
      industry:
        "I am a photographer. I want a portfolio. What if I wanted offline operation?",
    },
    unverifiedDetails: ["offline is hypothetical"],
    usefulFollowUpDimensions: ["websiteContent"],
    unacceptableAssumptions: ["integration", "webapp", "booking"],
    solutionCategories: ["portfolio"],
    readiness: true,
    retrievalRelevant: true,
    dimensions: ["presentation"],
  },
  {
    id: "clinical-boundary",
    situation: "Clinical diagnosis software",
    desiredOutcome: "Automate treatment decisions",
    confirmedFacts: {
      stage: "specific",
      request:
        "I need an application to diagnose patient illness and prescribe treatment",
    },
    unverifiedDetails: ["clinical expertise"],
    usefulFollowUpDimensions: [],
    unacceptableAssumptions: ["webapp", "integration", "ai"],
    solutionCategories: [],
    readiness: false,
    retrievalRelevant: false,
    dimensions: ["application"],
  },
  {
    id: "short-legitimate",
    situation: "A watchmaker",
    desiredOutcome: "Not established",
    confirmedFacts: { stage: "established", industry: "Watch repair" },
    unverifiedDetails: ["desired change"],
    usefulFollowUpDimensions: [],
    unacceptableAssumptions: ["website", "booking", "webapp"],
    solutionCategories: [],
    readiness: false,
    retrievalRelevant: false,
    dimensions: [],
  },
];
