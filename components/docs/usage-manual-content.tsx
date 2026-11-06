import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  { id: "introduction", label: "Introduction" },
  { id: "sign-in-roles", label: "Sign in & roles" },
  { id: "dashboard", label: "Dashboard" },
  { id: "assets", label: "Assets" },
  { id: "campaigns", label: "Verification campaigns" },
  { id: "exceptions", label: "Exceptions" },
  { id: "disposal", label: "Disposal, donation & sale" },
  { id: "depreciation", label: "Depreciation & valuation" },
  { id: "locations", label: "Locations & transfers" },
  { id: "qr-scanning", label: "QR scanning" },
  { id: "documents", label: "Documents" },
  { id: "maintenance", label: "Maintenance" },
  { id: "requests", label: "Asset requests" },
  { id: "replacement", label: "Replacement" },
  { id: "reports", label: "Reports & exports" },
  { id: "staff", label: "Staff" },
  { id: "users", label: "Users" },
  { id: "settings", label: "Settings" },
  { id: "tips", label: "Tips & troubleshooting" },
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
      <h2 className="text-xl font-semibold text-navy-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-navy-950/85">{children}</div>
    </section>
  );
}

export function UsageManualContent() {
  return (
    <div className="space-y-8">
      <Card className="border-navy-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Table of contents</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid gap-1 sm:grid-cols-2">
            {sections.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-md px-2 py-1.5 text-sm text-navy-800 underline-offset-2 hover:bg-navy-50 hover:underline"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      <Section id="introduction" title="Introduction">
        <p>
          VortAsset is an asset management system for tracking company equipment across branches, departments,
          rooms, and staff. It helps you answer: what you own, where it is, who is responsible, what it costs,
          and when it should be replaced, sold, or disposed.
        </p>
        <p>Your organization is structured as:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Organization</strong> — your company (one tenant). Profile includes type, industry, contact, and active status
          </li>
          <li>
            <strong>Regions</strong> — groups of branches
          </li>
          <li>
            <strong>Branches</strong> — offices or sites, each in one region
          </li>
          <li>
            <strong>Departments</strong> — cost centers used for spend and budget reporting
          </li>
          <li>
            <strong>Rooms and shelves</strong> — physical placement within a branch
          </li>
          <li>
            <strong>Assets</strong> — laptops, furniture, tools, and other tracked items
          </li>
        </ul>
        <p>
          Open this manual from <strong>Usage manual</strong> at the bottom of the sidebar, above the sync status.
          Most pages use search, filters, and pagination; action buttons show a spinner while saving.
        </p>
      </Section>

      <Section id="sign-in-roles" title="Sign in & roles">
        <p>
          Sign in with your email and password. Use <strong>Forgot password</strong> if you need a reset link.
          What you can do depends on your role:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Admin</strong> — full access across all branches: assets, campaigns, exceptions, requests,
            maintenance, reports, settings, and user management
          </li>
          <li>
            <strong>Manager</strong> — create and edit assets, documents, locations, and maintenance for their
            branch; create campaigns, verify when assigned, and manage exceptions; approve/reject/fulfill asset
            requests; view Replacement and the standard Replacement report (not finance-only tabs)
          </li>
          <li>
            <strong>Staff</strong> — view assets, campaigns, exceptions, documents, and maintenance; record location
            movements; submit asset requests and track their own request status
          </li>
          <li>
            <strong>Finance</strong> — view assets, campaigns, exceptions, and documents; open Reports including
            finance tabs (Department Cost, Disposal, End-of-Life FMV) and export Excel/PDF; no create/edit of assets,
            campaigns, or exceptions
          </li>
        </ul>
        <p>
          Admins see all branches. Managers, Staff, and Finance are normally scoped to their assigned branch.
        </p>
      </Section>

      <Section id="dashboard" title="Dashboard">
        <p>The dashboard is your starting point after sign-in. It shows:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Total assets in your scope</li>
          <li>Warranties expiring within 90 days (click through to the Assets list)</li>
          <li>Assets approaching or overdue for replacement</li>
          <li>Estimated replacement budget for the current year</li>
          <li>Open exceptions still awaiting a decision (click through to Exceptions)</li>
          <li>
            <strong>Assets requiring attention</strong> — missing, unverified in the active campaign, damaged,
            warranty expired or due soon, high maintenance, under repair, beyond useful life, pending disposal, and
            unresolved exceptions. Each card opens the matching list.
          </li>
          <li>
            Portfolio filters for region, branch, department, category, custodian, condition, status, and acquisition
            year, with totals by region and by in use, storage, under repair, and pending disposal
          </li>
        </ul>
      </Section>

      <Section id="assets" title="Assets">
        <p>
          The Assets page is the digital asset register. By default it shows <strong>active</strong> inventory
          only. You can still filter by disposed, donated, or sold status when you need history.
        </p>
        <p>From Assets you can:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create assets one at a time, including manufacturer, model, and an existing asset number (Admin/Manager)</li>
          <li>Bulk import from CSV using the template download</li>
          <li>Filter by branch and status; search by name, AIN, or serial number</li>
          <li>Print QR asset tags when QR scanning is enabled</li>
          <li>Open an asset for full profile, maintenance timeline, status history, and files</li>
        </ul>
        <p>Each asset records:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>AIN (internal asset ID) and serial number</li>
          <li>Purchase date, purchase cost, and warranty expiry</li>
          <li>Category, vendor, branch, department, room, and shelf</li>
          <li>Custodian (assigned staff member)</li>
          <li>
            Status: Active, Under Repair, Faulty, In Storage, Missing, Disposed, Donated, Sold
          </li>
          <li>Condition: Excellent, Good, Fair, Poor, Critical</li>
        </ul>
        <p>
          On the asset detail page you can edit profile fields, change status, create a work order, upload photos
          and documents, set depreciation overrides, report an exception, and record disposal. The financial snapshot
          shows purchase cost, age, depreciation applied, current value, and recommended sale price.
        </p>
      </Section>

      <Section id="campaigns" title="Verification campaigns">
        <p>
          Use <strong>Campaigns</strong> to check that the assets you expect are still on site. Admins and Managers
          create campaigns. Staff and Finance can open the list and follow progress, but only an assigned officer
          with write access can record a verification.
        </p>
        <p>
          <strong>Create a draft:</strong> <strong>New campaign</strong>. Enter a name, optional description, and
          start and end dates. Branches, departments, and categories are searchable. Leave a field empty to include
          all of that kind.
        </p>
        <p>While the campaign is <strong>Draft</strong>:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Open the campaign and use <strong>Edit draft</strong> if the name, dates, or scope need to change.
          </li>
          <li>
            On the <strong>Officers</strong> tab, choose <strong>Assign officer</strong>. Pick the person and,
            optionally, one branch. Leave the branch empty to cover every branch in the campaign.
          </li>
          <li>
            Choose <strong>Activate and freeze expected assets</strong>. Activation needs at least one officer. The
            expected count is the active assets in scope at that moment and does not change if assets are added later.
          </li>
        </ol>
        <p>After activation the campaign is <strong>Active</strong>. You can <strong>Pause</strong>, <strong>Resume</strong>, <strong>Complete</strong>, or <strong>Cancel</strong> it. The header shows:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Expected</strong> — assets frozen at activation
          </li>
          <li>
            <strong>Verified</strong>, <strong>Not found</strong>, <strong>Unregistered</strong>, and{" "}
            <strong>Exceptions</strong> — outcomes recorded so far
          </li>
          <li>
            <strong>Pending investigation</strong> — exceptions still identified, assigned, or under investigation
          </li>
          <li>
            <strong>Completion</strong> — verified assets divided by the expected count
          </li>
        </ul>
        <p>Assigned officers record findings in two places:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            On an asset scan, when this campaign includes that asset: <strong>Yes, verified</strong>,{" "}
            <strong>Not found</strong>, or <strong>Exception</strong>. This does not replace the movement form.
          </li>
          <li>
            On the campaign page: <strong>Record unregistered find</strong> for an item that is not in the register.
          </li>
        </ul>
        <p>
          Each in-scope asset can be verified once. A second attempt is refused, and an asset outside the frozen
          list is refused. <strong>Not found</strong> asks for one of the eight reasons, an optional photo, and the
          last known location. Other requires a note, and a bare Not found is refused. It opens a Missing exception.
          <strong>Exception</strong> asks for the mismatch type. <strong>Record unregistered find</strong> creates
          the asset, stores an Unregistered verification, and opens one Unregistered exception.
        </p>
        <p>
          CSV and PDF export is the engagement report: client, period, expected, verified, exceptions, unregistered,
          pending investigation, then totals by branch and by exception type.
        </p>
        <p>
          The <strong>Scope</strong>, <strong>Officers</strong>, and <strong>Progress by branch</strong> tabs show
          the frozen assets, assignments, and branch totals. On <strong>Export</strong>, download <strong>CSV</strong>{" "}
          or <strong>PDF</strong>. Those files use the same totals as the campaign header.
        </p>
      </Section>

      <Section id="exceptions" title="Exceptions">
        <p>
          An exception is a problem found during a campaign or reported from an asset. The queue defaults to{" "}
          <strong>Open</strong> items. That count matches the <strong>Open Exceptions</strong> card on the dashboard.
        </p>
        <p>Types:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Wrong location, Wrong custodian, Missing, Unregistered, Duplicate</li>
          <li>Damaged, Incorrect serial, Incorrect category, Disposed but registered, Other</li>
        </ul>
        <p>
          Filter the table by type, status, and assignee, or search by asset or description. Open a row to review
          the description, timeline, and evidence. Admins and Managers can upload a file and move the status. The
          form never lets you pick a status that skips a step.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Identified</strong> → Assign, Start investigation, or Reject
          </li>
          <li>
            <strong>Assigned</strong> → Start investigation or Reject
          </li>
          <li>
            <strong>Investigating</strong> → Resolve (a resolution note is required) or Reject
          </li>
          <li>
            <strong>Resolved</strong> → Approve. Approval stores who approved it. It is refused if there is no
            resolution note.
          </li>
        </ul>
        <p>
          You cannot approve an exception straight from Identified. To report one yourself, open the asset and
          choose <strong>More → Report exception</strong>. The asset is already filled in. Choose the type,
          describe the problem, and set an optional due date. One open exception is kept per campaign, asset, and
          type.
        </p>
      </Section>

      <Section id="disposal" title="Disposal, donation & sale">
        <p>
          When an asset should leave the organization, open the asset → <strong>More → Recommend disposal</strong>.
          Record the condition, recommended action, and reason. The asset stays in the register as Pending Disposal.
          An approver uses <strong>Approve disposal</strong>. <strong>Record Disposal</strong> stays unavailable
          until that recommendation is Approved. Nothing is disposed automatically.
        </p>
        <p>Recording disposal still requires one of:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Donated</strong> — given away; requires date and reason
          </li>
          <li>
            <strong>Sold</strong> — sold to an employee or external buyer; requires date, reason, sale price, and
            buyer name (contact optional). The form shows the recommended sale price from depreciation
          </li>
          <li>
            <strong>Thrown Away / Disposed</strong> — scrapped or otherwise removed; requires date and reason
          </li>
        </ul>
        <p>
          The asset is marked inactive and removed from active inventory. An audit disposal record is stored
          (including book value at disposal). View counts and value removed under <strong>Reports → Disposal</strong>.
        </p>
      </Section>

      <Section id="depreciation" title="Depreciation & valuation">
        <p>
          VortAsset calculates fair market / book value using straight-line depreciation. Rules are resolved in
          this order:
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Asset-level overrides (useful life, salvage value, method)</li>
          <li>Category depreciation policy under Settings → Depreciation</li>
          <li>Built-in industry defaults by category name (e.g. laptops often 3 years)</li>
        </ol>
        <p>
          Admins configure policies under <strong>Settings → Depreciation</strong> (useful life in years and
          salvage percent per category). Managers/Admins can override a single asset via{" "}
          <strong>More → Depreciation Overrides</strong>.
        </p>
        <p>
          Values appear on the asset detail financial snapshot and in{" "}
          <strong>Reports → End-of-Life FMV</strong> for assets approaching or overdue for replacement.
        </p>
      </Section>

      <Section id="locations" title="Locations & transfers">
        <p>
          Use <strong>Locations</strong> to record movements. Every change is logged with who moved it, when, and
          from/to details.
        </p>
        <p>Movement types:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Branch transfer</strong> — moves to another office (clears room/shelf)
          </li>
          <li>
            <strong>Department transfer</strong> — reassigns the cost center; department cost reports update
            automatically
          </li>
          <li>
            <strong>Room transfer</strong> — moves to a different room
          </li>
          <li>
            <strong>Shelf transfer</strong> — moves to a different shelf
          </li>
          <li>
            <strong>Staff assignment</strong> — changes the custodian only after the assignee accepts by checkbox, PIN, or signature. Store the assignment type and an optional return date
          </li>
          <li>
            <strong>Storage transfer</strong> — places the asset in storage (optional branch change)
          </li>
        </ul>
        <p>
          Admins define departments, rooms, and shelves under <strong>Settings → Locations</strong>. Every movement
          asks for a transfer reason, and history keeps the from and to locations. Departments are also used on
          asset create/edit and on asset requests.
        </p>
      </Section>

      <Section id="qr-scanning" title="QR scanning">
        <p>
          QR scanning is optional. An admin must enable it under <strong>Settings → Features</strong>.
        </p>
        <p>When enabled:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Print asset tags from the Assets list or asset detail page</li>
          <li>Print location tags from Settings → Locations or Settings → Branches</li>
          <li>Go to Locations → Scan location (or use the Scan page)</li>
          <li>Scan the asset tag first (which item)</li>
          <li>Scan the destination location tag (where it is going), or fill the movement form manually</li>
          <li>Choose movement type (including department transfer), review, and save</li>
        </ol>
        <p>
          You can paste a scanned value manually if the camera is unavailable. If the asset belongs to an active
          campaign you are assigned to, the scan page also offers <strong>Yes, verified</strong>,{" "}
          <strong>Not found</strong>, and <strong>Exception</strong> (see Verification campaigns). If you lose
          connectivity, queued movements can sync when you are back online (see the sync status under Usage manual
          in the sidebar).
        </p>
      </Section>

      <Section id="documents" title="Documents">
        <p>
          The Documents page is a central library of files attached to assets — receipts, warranty cards, manuals,
          service reports, maintenance invoices, and other files.
        </p>
        <p>
          Upload from the Documents page or from an asset&apos;s detail page (More → Upload Document). Maintenance
          invoices can also be attached from the Maintenance board via <strong>⋯ → Attachments</strong> (then
          Invoice), or from the asset maintenance timeline. Files are stored in cloud storage; open or delete based
          on your permissions.
        </p>
      </Section>

      <Section id="maintenance" title="Maintenance">
        <p>
          Use <strong>Maintenance</strong> to log service work and monitor condition flags. Use{" "}
          <strong>Log Service</strong> and <strong>Flag Condition</strong> in the page header (top right) to create
          records. Each maintenance record includes date reported, date sent, actual return, warranty claim,
          repair outcome, description, vendor, cost, next service date, and status:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Scheduled</strong> — planned work (also used for work orders created from asset details)
          </li>
          <li>
            <strong>In Progress</strong> — currently being worked
          </li>
          <li>
            <strong>Completed</strong> — finished
          </li>
        </ul>
        <p>
          Filter the table by status and edit records (including status) from the row menu. Open{" "}
          <strong>⋯ → Attachments</strong> to view invoices with file icons or upload a new invoice. On the asset
          detail page, the Maintenance tab shows a timeline, total maintenance cost vs purchase cost, and a warning
          when spend is high.
        </p>
        <p>
          When cumulative maintenance cost reaches the organization threshold (default 50% of purchase cost),
          VortAsset creates a condition flag: &quot;High maintenance cost — review for replacement.&quot; Change the
          threshold under <strong>Settings → Organization</strong>. Resolve open flags from the Maintenance board.
        </p>
      </Section>

      <Section id="requests" title="Asset requests">
        <p>
          Use <strong>Requests</strong> to formally ask for equipment. Staff and Admins can submit; Managers and
          Admins review.
        </p>
        <p>
          <strong>Submit a request:</strong> choose asset type (category), department, urgency (Low / Medium / High
          / Critical), reason, and optional notes. Staff see only their own requests.
        </p>
        <p>
          <strong>Review (Manager/Admin):</strong> Managers see requests for their branch; Admins see all branches.
          Approve or Reject with an optional comment. Requesters are notified by email (also logged in the system).
        </p>
        <p>
          <strong>On approve:</strong> VortAsset creates a pending asset in storage (placeholder AIN/serial) linked
          to the request. Open that asset to enter real purchase details, then use <strong>Mark fulfilled</strong>{" "}
          when assignment is complete (Managers/Admins with write access).
        </p>
        <p>Statuses: Pending → Approved or Rejected → Fulfilled.</p>
      </Section>

      <Section id="replacement" title="Replacement">
        <p>
          VortAsset evaluates assets against category replacement years and organization policies (including disposal
          grace months). States:
        </p>
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
        <p>
          On the Replacement page, use <strong>Recompute</strong> in the page header to refresh evaluations. For
          overdue assets, you can acknowledge disposal recommendations from the list. Configure default years and
          grace periods under <strong>Settings → Categories</strong> and <strong>Settings → Policies</strong>.
        </p>
      </Section>

      <Section id="reports" title="Reports & exports">
        <p>
          Open <strong>Reports</strong> for planning and audits. Tabs depend on your role:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Replacement</strong> — assets due for replacement and estimated cost (Admin, Manager, Finance)
          </li>
          <li>
            <strong>Department Cost</strong> — active asset count and total purchase cost by department (Admin,
            Finance)
          </li>
          <li>
            <strong>Disposal</strong> — counts and value removed by method; sale proceeds for sold assets (Admin,
            Finance)
          </li>
          <li>
            <strong>End-of-Life FMV</strong> — current and recommended sale values for approaching/overdue assets
            (Admin, Finance)
          </li>
        </ul>
        <p>
          The page includes a replacement cost trend chart (aggregated across all matching assets) and a
          searchable, paginated evaluation table with a state filter (Healthy / Approaching / Overdue). For the
          Replacement report, use <strong>PDF</strong> and <strong>Excel</strong> beside the Rows control — exports
          include all matching rows (up to 10,000) and respect the current state and search filters. Finance users
          also see an <strong>End-of-Life FMV</strong> section with its own pagination and export. For Department
          Cost and Disposal, export from the buttons on each tab. Department costs update when assets are transferred
          between departments.
        </p>
      </Section>

      <Section id="staff" title="Staff">
        <p>
          The Staff directory shows people in your organization and their relationship to assets. Open a staff
          member to see assigned assets, movement history, and status changes.
        </p>
        <p>
          This is custody tracking, not account administration. For login accounts and roles, use{" "}
          <strong>Users</strong> (Admin only).
        </p>
      </Section>

      <Section id="users" title="Users">
        <p>Admins manage login accounts from Users:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create users with name, email, temporary password, role, and branch</li>
          <li>Assign roles: Admin, Manager, Staff, or Finance</li>
          <li>Activate or deactivate access</li>
        </ul>
        <p>Deactivated users should not be able to sign in. Prefer linking each non-admin user to a branch.</p>
      </Section>

      <Section id="settings" title="Settings">
        <p>Admins configure the system under Settings:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Organization</strong> — name, type, industry, primary contact, email, phone, address, active status, and high-maintenance cost threshold (%)
          </li>
          <li>
            <strong>Regions</strong> — named groups for branches
          </li>
          <li>
            <strong>Branches</strong> — offices/sites, each assigned to a region, and branch QR tags
          </li>
          <li>
            <strong>Categories</strong> — asset types, default replacement years, and disposal grace months
          </li>
          <li>
            <strong>Vendors</strong> — suppliers linked to assets
          </li>
          <li>
            <strong>Locations</strong> — departments, rooms, and shelves (and location QR tags when QR is on)
          </li>
          <li>
            <strong>Features</strong> — optional tools such as QR location scanning
          </li>
          <li>
            <strong>Policies</strong> — organization-level replacement rules by category
          </li>
          <li>
            <strong>Depreciation</strong> — straight-line useful life and salvage percent by category
          </li>
          <li>
            <strong>Reminders</strong> — lead times for warranty expiry, replacement due, and maintenance due
            notifications
          </li>
          <li>
            <strong>Audit</strong> — log of important system actions for compliance
          </li>
        </ul>
        <p>
          Branch setup lives under Settings → Branches (the standalone Branches route redirects there). Location
          hierarchy (departments, rooms, shelves) is under Settings → Locations.
        </p>
      </Section>

      <Section id="tips" title="Tips & troubleshooting">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            If a menu item is missing, your role does not include that permission — ask an Admin to adjust your
            account.
          </li>
          <li>
            Activate a campaign only after assigning at least one officer. Empty branch, department, or category
            fields mean all of them. Only assigned officers can verify, and each asset can be verified once.
          </li>
          <li>
            Not found and other mismatches open an exception. Resolve needs a note, and Approve is available only
            after the exception is Resolved.
          </li>
          <li>
            The dashboard Open Exceptions count matches the Exceptions queue while the status filter is Open.
          </li>
          <li>
            Finance users can open Reports finance tabs but cannot create or edit assets, campaigns, or exceptions.
            Managers can edit assets but do not see finance-only report tabs (Admin and Finance do).
          </li>
          <li>
            Only Staff and Admins submit requests; Managers approve/reject and fulfill. After approving, open the
            pending asset to set a real AIN, serial, and purchase cost before fulfilling.
          </li>
          <li>
            Sold disposal requires buyer name and sale price; use the recommended sale price as a starting point.
          </li>
          <li>
            Department cost reports only include active assets; disposed/donated/sold items appear under Disposal.
          </li>
          <li>
            On Reports, filter Replacement by state (or search) before downloading — PDF and Excel beside Rows use
            those same filters.
          </li>
          <li>
            For CSV import, download the template first, fill rows carefully, then upload from Assets → Import CSV.
          </li>
          <li>
            Use Forgot password on the sign-in page if you cannot access your account; Admins can also reset access
            by deactivating/recreating users when needed.
          </li>
          <li>
            Action buttons show a loading spinner while the server saves — wait for it to finish before closing the
            dialog.
          </li>
        </ul>
      </Section>
    </div>
  );
}
