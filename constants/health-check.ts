export type HealthCheckArea = {
  id: string;
  name: string;
  weight: number;
  prompt: string;
};

export const HEALTH_CHECK_AREAS: HealthCheckArea[] = [
  { id: "governance", name: "Governance & Policy", weight: 1, prompt: "Policies and ownership of asset management are clear." },
  { id: "register", name: "Asset Register Quality", weight: 1.2, prompt: "The register is complete, accurate, and current." },
  { id: "accountability", name: "Accountability & Custody", weight: 1.1, prompt: "Assets are assigned and acknowledgements are enforced." },
  { id: "verification", name: "Physical Verification", weight: 1.2, prompt: "Verification campaigns run regularly with clear completion." },
  { id: "exceptions", name: "Exception Management", weight: 1, prompt: "Exceptions are owned, tracked, and closed promptly." },
  { id: "maintenance", name: "Maintenance & Condition", weight: 1, prompt: "Condition and repair history are actively managed." },
  { id: "lifecycle", name: "Lifecycle & Replacement", weight: 1, prompt: "Replacement and disposal follow configured rules." },
  { id: "procurement", name: "Procurement & Onboarding", weight: 0.9, prompt: "New assets are captured at acquisition with complete master data." },
  { id: "locations", name: "Location Hierarchy", weight: 0.9, prompt: "Branch, room, and shelf structure is maintained and used." },
  { id: "reporting", name: "Reporting & Insight", weight: 0.9, prompt: "Management receives timely, decision-ready reports." },
  { id: "controls", name: "Controls & Audit Trail", weight: 1.1, prompt: "Changes are auditable and sensitive fields are controlled." },
  { id: "security", name: "Access & Security", weight: 1, prompt: "Roles, permissions, and privileged actions are controlled." },
  { id: "data_quality", name: "Data Quality & Dedup", weight: 0.9, prompt: "Duplicates, missing fields, and stale records are actively cleaned." },
  { id: "capability", name: "People & Capability", weight: 0.8, prompt: "Staff are trained and roles are understood." },
];

export const MATURITY_LEVELS = [
  { level: 1, label: "Unstructured" },
  { level: 2, label: "Developing" },
  { level: 3, label: "Controlled" },
  { level: 4, label: "Digitally Managed" },
  { level: 5, label: "Optimized" },
] as const;
