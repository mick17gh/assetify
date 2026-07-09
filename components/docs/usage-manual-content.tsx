import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  { id: "introduction", label: "Introduction" },
  { id: "sign-in-roles", label: "Sign in & roles" },
  { id: "dashboard", label: "Dashboard" },
  { id: "assets", label: "Assets" },
  { id: "locations", label: "Locations" },
  { id: "qr-scanning", label: "QR scanning" },
  { id: "documents", label: "Documents" },
  { id: "maintenance", label: "Maintenance" },
  { id: "replacement", label: "Replacement" },
  { id: "reports", label: "Reports" },
  { id: "staff", label: "Staff" },
  { id: "users", label: "Users" },
  { id: "settings", label: "Settings" },
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <h2 className="text-xl font-semibold text-[#6D28D9]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-purple-950/85">{children}</div>
    </section>
  );
}

export function UsageManualContent() {
  return (
    <div className="space-y-8">
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Table of contents</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid gap-1 sm:grid-cols-2">
            {sections.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-md px-2 py-1.5 text-sm text-purple-800 underline-offset-2 hover:bg-purple-50 hover:underline"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      <Section id="introduction" title="Introduction">
        <p>
          Assetify is an asset management system for tracking company equipment across branches, rooms, and staff.
          It helps you answer three questions at any time: what you own, where it is, and who is responsible for it.
        </p>
        <p>Your organization is structured as:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Organization</strong> — your company
          </li>
          <li>
            <strong>Branches</strong> — offices or sites
          </li>
          <li>
            <strong>Departments, rooms, and shelves</strong> — physical placement within a branch
          </li>
          <li>
            <strong>Assets</strong> — laptops, furniture, tools, and other tracked items
          </li>
        </ul>
      </Section>

      <Section id="sign-in-roles" title="Sign in & roles">
        <p>Sign in with your email and password. What you can do depends on your role:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Admin</strong> — full access across all branches, including user management and settings
          </li>
          <li>
            <strong>Manager</strong> — manage assets, documents, locations, and reports for their branch
          </li>
          <li>
            <strong>Staff</strong> — view assets and documents, and record location movements
          </li>
        </ul>
      </Section>

      <Section id="dashboard" title="Dashboard">
        <p>The dashboard is your starting point after sign-in. It shows:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Total assets in your scope</li>
          <li>Warranties expiring within 90 days</li>
          <li>Assets approaching or overdue for replacement</li>
          <li>Estimated replacement budget for the current year</li>
          <li>Charts for asset status and branch distribution</li>
        </ul>
      </Section>

      <Section id="assets" title="Assets">
        <p>The Digital Asset Register is the core of Assetify. From the Assets page you can:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create assets one at a time or bulk import from CSV</li>
          <li>Filter by branch and status</li>
          <li>Search by name, AIN, or serial number</li>
          <li>Open an asset to view its overview, movement history, status history, and maintenance records</li>
        </ul>
        <p>Each asset records:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>AIN (internal asset ID) and serial number</li>
          <li>Purchase date, cost, and warranty expiry</li>
          <li>Category, vendor, branch, room, and shelf</li>
          <li>Custodian (assigned staff member)</li>
          <li>Status (Active, Under Repair, Faulty, In Storage, Missing, Disposed) and condition</li>
        </ul>
        <p>From asset details you can upload photos and documents, change status, create work orders, and dispose of assets when retired.</p>
      </Section>

      <Section id="locations" title="Locations">
        <p>Use the Locations page to record where assets move. Common movement types include:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Branch transfer</strong> — asset moves to another office
          </li>
          <li>
            <strong>Room transfer</strong> — asset moves to a different room
          </li>
          <li>
            <strong>Shelf transfer</strong> — asset moves to a different shelf
          </li>
          <li>
            <strong>Staff assignment</strong> — custodian changes to another person
          </li>
          <li>
            <strong>Storage transfer</strong> — asset placed in storage
          </li>
        </ul>
        <p>Every movement is logged with who made the change, when it happened, and the from/to details.</p>
      </Section>

      <Section id="qr-scanning" title="QR scanning">
        <p>QR scanning is optional and must be enabled by an admin in Settings → Features.</p>
        <p>When enabled:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Print asset tags from the Assets list or asset detail page</li>
          <li>Print location tags from Settings → Locations (rooms/shelves) or Settings → Branches</li>
          <li>Go to Locations → Scan location</li>
          <li>Scan the asset tag first (which item)</li>
          <li>Scan the destination location tag (where it is going)</li>
          <li>Review the pre-filled form and save the movement</li>
        </ol>
        <p>You can also paste a scanned value manually if the camera is unavailable.</p>
      </Section>

      <Section id="documents" title="Documents">
        <p>The Documents page is a central library of files attached to assets — receipts, warranty cards, manuals, and service reports.</p>
        <p>You can upload documents from the Documents page or from an individual asset&apos;s detail page. Files are stored in cloud storage and can be opened or deleted based on your permissions.</p>
      </Section>

      <Section id="maintenance" title="Maintenance">
        <p>When an asset needs repair, create a work order on the Maintenance board. Track priority, description, and resolution.</p>
        <p>Asset status can be updated to Under Repair or Faulty while maintenance is in progress, then returned to Active when resolved.</p>
      </Section>

      <Section id="replacement" title="Replacement">
        <p>Assetify tracks asset age against category rules and organization policies. Assets move through lifecycle states:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Healthy</strong> — within expected lifespan
          </li>
          <li>
            <strong>Approaching</strong> — nearing end of life
          </li>
          <li>
            <strong>Overdue</strong> — past recommended replacement date
          </li>
        </ul>
        <p>The Replacement page shows assets due for replacement and estimated costs. Disposal recommendations appear when assets are eligible for retirement.</p>
      </Section>

      <Section id="reports" title="Reports">
        <p>The Reports page lets managers export data for planning and audits. Exports include asset registers, branch summaries, and replacement forecasts in Excel or PDF format.</p>
      </Section>

      <Section id="staff" title="Staff">
        <p>The Staff directory shows people in your organization and their relationship to assets. Open a staff member to see:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Assets currently assigned to them</li>
          <li>Movement history for those assets</li>
          <li>Status change history</li>
        </ul>
        <p>This is for custody tracking. For login account management, use the Users page (admin only).</p>
      </Section>

      <Section id="users" title="Users">
        <p>Admins manage user accounts from the Users page — create accounts, assign roles (Admin, Manager, Staff), link users to branches, and activate or deactivate access.</p>
      </Section>

      <Section id="settings" title="Settings">
        <p>Admins configure the system under Settings:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Organization</strong> — company name and details
          </li>
          <li>
            <strong>Branches</strong> — offices and branch QR tags
          </li>
          <li>
            <strong>Categories</strong> — asset types and default lifespans
          </li>
          <li>
            <strong>Vendors</strong> — suppliers
          </li>
          <li>
            <strong>Locations</strong> — departments, rooms, and shelves
          </li>
          <li>
            <strong>Features</strong> — optional tools like QR scanning
          </li>
          <li>
            <strong>Policies</strong> — replacement rules by category
          </li>
          <li>
            <strong>Reminders</strong> — warranty and maintenance notifications
          </li>
          <li>
            <strong>Audit</strong> — log of important system actions
          </li>
        </ul>
      </Section>
    </div>
  );
}
