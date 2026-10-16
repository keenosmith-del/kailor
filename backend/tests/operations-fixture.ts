import type { Answers } from "../../shared/src/index.js";
export const logisticsPersona: Answers = {
  stage: "established",
  kind: "business",
  industry:
    "A small local parcel collection and delivery business with 12 vehicles and drivers, two operations coordinators and an owner. Customers are small businesses, online shops and individuals.",
  tools:
    "Customers request work through WhatsApp or telephone. Coordinators record jobs in spreadsheets and assign drivers through WhatsApp. Drivers use their smartphones and Google Maps for directions.",
  workflowDetails:
    "Manual scheduling and driver assignment. Missed driver updates and limited visibility into delivery status. Photos or paper signatures for proof of delivery. Growing work causes follow-ups and inconsistent audit records.",
  goals:
    "Reduce administration and improve delivery coordination, status visibility and reliable completion records.",
  accessDetails:
    "Drivers must only see assigned deliveries. Coordinators manage operations and the owner has broader oversight.",
  reportingDetails:
    "Delivery history and search, CSV exports and an operations dashboard are essential.",
  scopeDetails:
    "Essential first-phase requirements: delivery creation and scheduling; driver assignment and reassignment; smartphone access to assigned jobs; driver-updated delivery statuses; digital proof of delivery with photos; operations dashboard; delivery history and search; CSV exports; role-based access permissions; appropriate protection of customer information. Optional later improvements: secure customer tracking links and automatic customer notifications. Live GPS tracking, advanced route optimisation, a dedicated native mobile application and complex analytics can wait.",
  constraints:
    "Evaluate an established delivery-management platform before custom development. Existing tools are inexpensive and familiar. A gradual transition needs spreadsheet migration and staff training without interrupting daily operations.",
};
