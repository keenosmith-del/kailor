export const services = [
  {
    id: "instagram",
    name: "Set up an Instagram business page",
    delivery: "in-house",
    description:
      "Establish the business profile you requested, with account ownership and content responsibilities agreed first.",
  },
  {
    id: "website",
    name: "Professional website",
    delivery: "in-house",
    description: "A focused presence for your offering and enquiries.",
  },
  {
    id: "portfolio",
    name: "Portfolio website",
    delivery: "in-house",
    description: "A considered showcase of selected work.",
  },
  {
    id: "modernization",
    name: "Website modernization",
    delivery: "in-house",
    description:
      "Improve an existing website after a technical and content audit.",
  },
  {
    id: "email",
    name: "Business email and domain",
    delivery: "third-party technology",
    description: "Configure a domain and provider-managed mailbox.",
  },
  {
    id: "booking",
    name: "Booking integration",
    delivery: "third-party technology",
    description: "Connect an appropriate scheduling service.",
  },
  {
    id: "payment",
    name: "Payment integration",
    delivery: "third-party technology",
    description:
      "Connect an approved payment provider after requirements review.",
  },
  {
    id: "webapp",
    name: "Custom web application",
    delivery: "custom / exploratory",
    description: "Validate and scope a purpose-built tool.",
  },
  {
    id: "mobile",
    name: "Mobile application",
    delivery: "partner delivered",
    description: "Assess native needs and source a suitable delivery partner.",
  },
  {
    id: "automation",
    name: "Workflow automation",
    delivery: "custom / exploratory",
    description:
      "Reduce a demonstrated repetitive step with reviewed integrations.",
  },
  {
    id: "cms",
    name: "Content management",
    delivery: "in-house",
    description: "An editable structure for ongoing content.",
  },
  {
    id: "ai",
    name: "AI integration",
    delivery: "custom / exploratory",
    description: "A bounded AI pilot with human review and cost controls.",
  },
  {
    id: "integration",
    name: "Business software integration",
    delivery: "custom / exploratory",
    description:
      "Connect existing systems where supported APIs and permissions exist.",
  },
  {
    id: "publishing",
    name: "Research and publishing workflow",
    delivery: "custom / exploratory",
    description:
      "Proposed research, draft approval and publishing workflow; implementation requires separate scoping.",
  },
].map((s) => ({
  ...s,
  hoursLow: null as number | null,
  hoursHigh: null as number | null,
}));
