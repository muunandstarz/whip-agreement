/*
 * AdminDashboard — Whip Agreement Back-Office Platform
 *
 * Tabs:
 *  Overview    — metrics cards + exception queue
 *  Members     — import (CSV / manual) + member list + edit member
 *  Agreements  — pipeline board + bulk send/resend + detail drawer
 *  Generate    — generate a link for a specific member (search by name/email/ID)
 */

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { MARKETS } from "@/lib/agreementData";
import { buildReservationId } from "@shared/reservationId";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgreementStatus =
  | "not_sent" | "sent" | "delivered" | "opened"
  | "verified" | "in_progress" | "completed"
  | "expired" | "failed" | "needs_review";

const STATUS_LABELS: Record<AgreementStatus, string> = {
  not_sent: "Not Sent",
  sent: "Sent",
  delivered: "Delivered",
  opened: "Opened",
  verified: "Verified",
  in_progress: "In Progress",
  completed: "Completed",
  expired: "Expired",
  failed: "Failed",
  needs_review: "Needs Review",
};

const STATUS_COLORS: Record<AgreementStatus, string> = {
  not_sent: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-cyan-100 text-cyan-700",
  opened: "bg-purple-100 text-purple-700",
  verified: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  expired: "bg-orange-100 text-orange-700",
  failed: "bg-red-100 text-red-700",
  needs_review: "bg-pink-100 text-pink-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status as AgreementStatus;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}`}>
      {STATUS_LABELS[s] ?? status}
    </span>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-5 border ${accent ? "bg-[#FF6A00] text-white border-[#FF6A00]" : "bg-white border-gray-200"}`}>
      <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${accent ? "text-white/80" : "text-gray-500"}`}>{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-white" : "text-[#0b1228]"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-white/70" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: metrics, isLoading } = trpc.admin.agreements.metrics.useQuery();
  const { data: exceptions } = trpc.admin.agreements.list.useQuery({ hasException: true, limit: 10, offset: 0 });
  const testEmailMutation = trpc.admin.testEmail.useMutation();
  const testSmsMutation = trpc.admin.testSms.useMutation();
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testSmsTo, setTestSmsTo] = useState("");

  const handleTestEmail = async () => {
    if (!testEmailTo) { toast.error("Enter an email address"); return; }
    try {
      const r = await testEmailMutation.mutateAsync({ to: testEmailTo });
      if (r.sent) toast.success(`Test email sent to ${testEmailTo} via ${r.smtpHost}`);
      else toast.error("Email send returned false — check server logs for SMTP errors");
    } catch (e) {
      toast.error("Test email failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleTestSms = async () => {
    if (!testSmsTo) { toast.error("Enter a phone number"); return; }
    try {
      const r = await testSmsMutation.mutateAsync({ to: testSmsTo });
      if (r.sent) toast.success(`Test SMS sent to ${testSmsTo}`);
      else if (!r.hasKey) toast.error("TextLine API key not configured — SMS disabled");
      else toast.error("SMS send returned false — check server logs (TextLine may be returning 401)");
    } catch (e) {
      toast.error("Test SMS failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading metrics...</div>;

  const m = metrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Agreements" value={m?.total ?? 0} />
        <MetricCard label="Completion Rate" value={`${m?.completionRate ?? 0}%`} accent />
        <MetricCard label="Avg. Time to Sign" value={`${m?.avgMinutesToSign ?? 0}m`} sub="minutes" />
        <MetricCard label="Open Exceptions" value={m?.exceptions ?? 0} sub="need review" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-[#0b1228] mb-4">Agreement Pipeline</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {(["not_sent", "sent", "opened", "verified", "completed"] as AgreementStatus[]).map(s => (
            <div key={s} className="text-center">
              <div className={`rounded-lg p-3 mb-1 ${STATUS_COLORS[s]}`}>
                <p className="text-2xl font-bold">{m?.byStatus?.[s] ?? 0}</p>
              </div>
              <p className="text-xs text-gray-500">{STATUS_LABELS[s]}</p>
            </div>
          ))}
        </div>
      </div>

      {(exceptions?.rows?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <h3 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            Exception Queue ({exceptions?.total})
          </h3>
          <div className="space-y-2">
            {exceptions?.rows?.map(row => (
              <div key={row.agreement.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-[#0b1228]">{row.member?.name ?? "—"}</p>
                  <p className="text-xs text-gray-500">{row.member?.reservationId} · {row.agreement.exceptionReason ?? "No reason provided"}</p>
                </div>
                <StatusBadge status={row.agreement.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Test Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-[#0b1228] mb-1">Delivery Test</h3>
        <p className="text-xs text-gray-500 mb-4">Verify that email and SMS delivery are working without needing a member record.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Test Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="recipient@example.com"
                value={testEmailTo}
                onChange={e => setTestEmailTo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleTestEmail()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
              />
              <button
                onClick={handleTestEmail}
                disabled={testEmailMutation.isPending}
                className="px-4 py-2 bg-[#0b1228] text-white rounded-lg text-sm font-medium hover:bg-[#1a2540] disabled:opacity-50 transition-colors"
              >
                {testEmailMutation.isPending ? "Sending..." : "Send Test"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Test SMS</label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="+15175551234"
                value={testSmsTo}
                onChange={e => setTestSmsTo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleTestSms()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
              />
              <button
                onClick={handleTestSms}
                disabled={testSmsMutation.isPending}
                className="px-4 py-2 bg-[#0b1228] text-white rounded-lg text-sm font-medium hover:bg-[#1a2540] disabled:opacity-50 transition-colors"
              >
                {testSmsMutation.isPending ? "Sending..." : "Send Test"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Member Edit Drawer ───────────────────────────────────────────────────────

const MEMBER_FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "name", label: "Full Name" },
  { key: "dob", label: "Date of Birth", type: "date" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email", type: "email" },
  { key: "driverLicense", label: "Driver License #" },
  { key: "licenseState", label: "License State" },
  { key: "address", label: "Address" },
  { key: "cityStateZip", label: "City, State ZIP" },
  { key: "customerId", label: "Customer ID" },
  { key: "reservationId", label: "Reservation ID" },
  { key: "vehicle", label: "Vehicle" },
  { key: "vin", label: "VIN" },
  { key: "weeklyRate", label: "Weekly Rate" },
  { key: "deposit", label: "Deposit" },
  { key: "startDate", label: "Start Date", type: "date" },
  { key: "endDate", label: "End Date", type: "date" },
];

type MemberRecord = Record<string, string | number | Date | null | undefined>;

function EditMemberDrawer({ member, onClose, onSaved }: { member: MemberRecord; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {};
    for (const { key } of MEMBER_FIELDS) {
      const v = member[key];
      f[key] = v != null ? String(v) : "";
    }
    // also include market and agreementState (not in MEMBER_FIELDS loop)
    f.market = member.market != null ? String(member.market) : "";
    f.agreementState = member.agreementState != null ? String(member.agreementState) : "";
    return f;
  });

  const updateMutation = trpc.admin.members.update.useMutation();

  // Auto-compute reservationId when customerId, vin, or startDate changes.
  // Clears reservationId when any source field is incomplete.
  const handleFieldChange = (key: string, value: string) => {
    setForm(f => {
      const next = { ...f, [key]: value };
      if (["customerId", "vin", "startDate"].includes(key)) {
        const computed = buildReservationId(next.customerId, next.vin, next.startDate);
        next.reservationId = computed; // empty string when any source field is missing
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({ id: member.id as number, ...form });
      toast.success("Member updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Update failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#0b1228]">
          <h2 className="font-semibold text-white">Edit Member</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">×</button>
        </div>
        <form onSubmit={handleSave} className="flex-1 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MEMBER_FIELDS.map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={type ?? "text"}
                  value={form[key] ?? ""}
                  onChange={e => handleFieldChange(key, e.target.value)}
                  readOnly={key === "reservationId"}
                  className={`w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] ${key === "reservationId" ? "bg-gray-50 text-gray-500 cursor-default" : ""}`}
                />
                {key === "reservationId" && <p className="text-xs text-gray-400 mt-0.5">Auto-computed from Customer ID, VIN &amp; Start Date</p>}
              </div>
            ))}
            {/* Market dropdown — sets market + auto-fills agreementState */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Market</label>
              <select
                value={form.market ?? ""}
                onChange={e => {
                  const mkt = MARKETS.find(m => m.name === e.target.value);
                  handleFieldChange("market", e.target.value);
                  if (mkt) handleFieldChange("agreementState", mkt.state);
                }}
                required
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              >
                <option value="">Select a market…</option>
                {MARKETS.map(m => (
                  <option key={m.name} value={m.name}>{m.name} ({m.state})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Agreement State</label>
              <input
                type="text"
                value={form.agreementState ?? ""}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-gray-50 text-gray-500 cursor-default"
              />
              <p className="text-xs text-gray-400 mt-0.5">Auto-filled from Market</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-[#FF6A00] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#e55f00] disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

const MEMBER_CSV_HEADERS = [
  "name", "dob", "phone", "email", "driverLicense", "licenseState",
  "address", "cityStateZip", "customerId", "reservationId", "vehicle",
  "vin", "weeklyRate", "deposit", "startDate", "endDate",
];

function MembersTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [editMember, setEditMember] = useState<MemberRecord | null>(null);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = trpc.admin.members.list.useQuery({
    search: search || undefined,
    limit: 20,
    offset: page * 20,
  });

  const bulkImport = trpc.admin.members.bulkImport.useMutation();
  const createMember = trpc.admin.members.create.useMutation();

  const [form, setForm] = useState<Record<string, string>>({
    name: "", dob: "", phone: "", email: "", driverLicense: "", licenseState: "",
    address: "", cityStateZip: "", customerId: "", reservationId: "", vehicle: "",
    vin: "", weeklyRate: "", deposit: "", market: "", agreementState: "", startDate: "", endDate: "",
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); return; }
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
      });
      setCsvRows(rows);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!csvRows.length) return;
    setImporting(true);
    try {
      const result = await bulkImport.mutateAsync({ rows: csvRows as Parameters<typeof bulkImport.mutateAsync>[0]["rows"] });
      toast.success(`Imported ${result.imported} of ${result.total} members`);
      setCsvRows([]);
      if (fileRef.current) fileRef.current.value = "";
      refetch();
    } catch (err) {
      toast.error("Import failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setImporting(false);
    }
  };

  // Auto-compute reservationId when customerId, vin, or startDate changes.
  // Clears reservationId when any source field is incomplete.
  const handleFormFieldChange = (field: string, value: string) => {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (["customerId", "vin", "startDate"].includes(field)) {
        const computed = buildReservationId(next.customerId, next.vin, next.startDate);
        next.reservationId = computed; // empty string when any source field is missing
      }
      return next;
    });
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMember.mutateAsync(form as Parameters<typeof createMember.mutateAsync>[0]);
      toast.success("Member created");
      setShowManual(false);
      setForm({ name: "", dob: "", phone: "", email: "", driverLicense: "", licenseState: "", address: "", cityStateZip: "", customerId: "", reservationId: "", vehicle: "", vin: "", weeklyRate: "", deposit: "", market: "", agreementState: "", startDate: "", endDate: "" });
      refetch();
    } catch (err) {
      toast.error("Failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="space-y-5">
      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Search by name, email, VIN, reservation..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowManual(v => !v)}
            className="bg-[#0b1228] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#1a2540] transition-colors"
          >
            + Add Member
          </button>
          <label className="bg-white border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            Import CSV
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
        </div>
      </div>

      {/* CSV preview */}
      {csvRows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">{csvRows.length} rows ready to import</p>
          <div className="overflow-x-auto max-h-40 text-xs">
            <table className="w-full">
              <thead><tr>{MEMBER_CSV_HEADERS.slice(0, 6).map(h => <th key={h} className="text-left px-2 py-1 text-blue-700">{h}</th>)}</tr></thead>
              <tbody>
                {csvRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-blue-100">
                    {MEMBER_CSV_HEADERS.slice(0, 6).map(h => <td key={h} className="px-2 py-1 text-blue-900">{row[h] ?? ""}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleBulkImport} disabled={importing} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {importing ? "Importing..." : "Confirm Import"}
            </button>
            <button onClick={() => { setCsvRows([]); if (fileRef.current) fileRef.current.value = ""; }} className="text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual form */}
      {showManual && (
        <form onSubmit={handleManualCreate} className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0b1228] mb-4">New Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {MEMBER_CSV_HEADERS.map(field => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                <input
                  type={field === "dob" || field === "startDate" || field === "endDate" ? "date" : "text"}
                  value={form[field] ?? ""}
                  onChange={e => handleFormFieldChange(field, e.target.value)}
                  readOnly={field === "reservationId"}
                  className={`w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] ${field === "reservationId" ? "bg-gray-50 text-gray-500 cursor-default" : ""}`}
                  required={field !== "reservationId"}
                />
              </div>
            ))}
            {/* Market dropdown */}
            <div className="sm:col-span-2 md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Market</label>
              <select
                value={form.market ?? ""}
                onChange={e => {
                  const mkt = MARKETS.find(m => m.name === e.target.value);
                  handleFormFieldChange("market", e.target.value);
                  if (mkt) handleFormFieldChange("agreementState", mkt.state);
                }}
                required
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              >
                <option value="">Select a market…</option>
                {MARKETS.map(m => (
                  <option key={m.name} value={m.name}>{m.name} ({m.state})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Agreement State</label>
              <input
                type="text"
                value={form.agreementState ?? ""}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-gray-50 text-gray-500 cursor-default"
              />
              <p className="text-xs text-gray-400 mt-0.5">Auto-filled from Market</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={createMember.isPending} className="bg-[#FF6A00] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#e55f00] disabled:opacity-50">
              {createMember.isPending ? "Creating..." : "Create Member"}
            </button>
            <button type="button" onClick={() => setShowManual(false)} className="text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Members table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reservation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Market</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">State</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
              )}
              {!isLoading && (data?.rows?.length ?? 0) === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No members found</td></tr>
              )}
              {data?.rows?.map(member => {
                const marketName = MARKETS.find(m => m.states.includes(member.agreementState ?? ''))?.name ?? '—';
                return (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">#{member.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0b1228]">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{member.customerId}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{member.reservationId}</td>
                  <td className="px-4 py-3 text-gray-600">{member.vehicle}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#171b31] text-white">{marketName}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{member.agreementState}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.matchStatus === "matched" ? "bg-green-100 text-green-700" :
                      member.matchStatus === "flagged" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {member.matchStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditMember(member as unknown as MemberRecord)}
                      className="text-xs text-[#FF6A00] hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(data?.total ?? 0) > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {page * 20 + 1}–{Math.min((page + 1) * 20, data?.total ?? 0)} of {data?.total}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={(page + 1) * 20 >= (data?.total ?? 0)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {editMember && (
        <EditMemberDrawer
          member={editMember}
          onClose={() => setEditMember(null)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}

// ─── Agreement Detail Drawer ──────────────────────────────────────────────────

function AgreementDetailDrawer({
  agreementId,
  onClose,
  origin,
}: {
  agreementId: number;
  onClose: () => void;
  origin: string;
}) {
  const { data, isLoading, refetch } = trpc.admin.agreements.get.useQuery({ id: agreementId });
  const sendMutation = trpc.admin.agreements.send.useMutation();
  const resendMutation = trpc.admin.agreements.resend.useMutation();
  const revokeMutation = trpc.admin.agreements.revoke.useMutation();

  const [sending, setSending] = useState(false);

  const handleSend = async (via: "email" | "sms" | "both") => {
    setSending(true);
    try {
      await sendMutation.mutateAsync({ agreementId, via, origin });
      toast.success("Agreement sent");
      refetch();
    } catch (err) {
      toast.error("Send failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendMutation.mutateAsync({ agreementId, origin });
      toast.success("Reminder sent");
      refetch();
    } catch (err) {
      toast.error("Resend failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Revoke this agreement? The member will no longer be able to access it.")) return;
    try {
      await revokeMutation.mutateAsync({ agreementId });
      toast.success("Agreement revoked");
      refetch();
    } catch (err) {
      toast.error("Revoke failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const agreementLink = data ? `${origin}/agreement/${data.agreement.token}` : "";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#0b1228]">
          <h2 className="font-semibold text-white">Agreement #{agreementId}</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">×</button>
        </div>

        {isLoading && <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>}

        {data && (
          <div className="flex-1 p-6 space-y-5">
            {/* Status + exception */}
            <div className="flex items-center gap-3">
              <StatusBadge status={data.agreement.status} />
              {data.agreement.hasException && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Exception</span>
              )}
            </div>

            {/* Visual checkpoint timeline */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">Agreement Progress</p>
              <div className="flex items-start justify-between">
                {([
                  { key: "sent",     label: "Sent",     ts: data.agreement.sentAt,     statuses: ["sent","delivered","opened","verified","in_progress","completed","expired"] as string[] },
                  { key: "opened",   label: "Opened",   ts: null,                       statuses: ["opened","verified","in_progress","completed"] as string[] },
                  { key: "verified", label: "Verified", ts: data.agreement.verifiedAt,  statuses: ["verified","in_progress","completed"] as string[] },
                  { key: "signed",   label: "Signed",   ts: data.agreement.signedAt,    statuses: ["completed"] as string[] },
                ]).map((step, i, arr) => {
                  const done = step.statuses.includes(data.agreement.status);
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {i < arr.length - 1 && (
                        <div className={`absolute top-3 left-1/2 w-full h-0.5 ${done ? "bg-[#FF6A00]" : "bg-gray-200"}`} />
                      )}
                      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                        done ? "bg-[#FF6A00] border-[#FF6A00] text-white" : "bg-white border-gray-300 text-gray-300"
                      }`}>
                        {done ? "✓" : ""}
                      </div>
                      <p className={`mt-1 text-xs font-semibold ${done ? "text-[#FF6A00]" : "text-gray-400"}`}>{step.label}</p>
                      {step.ts && (
                        <p className="text-[9px] text-gray-400 text-center">{new Date(step.ts).toLocaleDateString()}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {data.member && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-[#0b1228]">{data.member.name}</p>
                <p className="text-sm text-gray-600">{data.member.email} · {data.member.phone}</p>
                <p className="text-sm text-gray-600">{data.member.vehicle} ({data.member.vin?.slice(-6)})</p>
                <p className="text-sm text-gray-600">Res: {data.member.reservationId} · State: {data.member.agreementState}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase">Agreement Link</p>
              <div className="flex gap-2">
                <input readOnly value={agreementLink} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs bg-gray-50 text-gray-700" />
                <button
                  onClick={() => { navigator.clipboard.writeText(agreementLink); toast.success("Copied!"); }}
                  className="bg-[#0b1228] text-white text-xs px-3 py-2 rounded-lg hover:bg-[#1a2540]"
                >
                  Copy
                </button>
              </div>
              {data.agreement.expiresAt && (
                <p className="text-xs text-gray-400">Expires: {new Date(data.agreement.expiresAt).toLocaleString()}</p>
              )}
            </div>

            {/* Signed document link */}
            {data.documents && data.documents.length > 0 && (() => {
              const signedDoc = data.documents.find(d => d.documentType === "combined_pdf") ??
                                data.documents.find(d => d.documentType === "member_agreement") ??
                                data.documents[data.documents.length - 1];
              return (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Signed Document</p>
                  <a
                    href={signedDoc.s3Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full bg-green-50 border border-green-200 text-green-800 text-sm py-2 px-4 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <span className="text-base">📄</span>
                    <span className="flex-1 font-medium">View Signed Agreement</span>
                    <span className="text-xs text-green-600">↗</span>
                  </a>
                  {data.documents.length > 1 && (
                    <div className="space-y-1">
                      {data.documents.map(doc => (
                        <a
                          key={doc.id}
                          href={doc.s3Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#FF6A00] py-0.5"
                        >
                          <span>📎</span>
                          <span className="capitalize">{doc.documentType.replace(/_/g, " ")}</span>
                          <span className="text-gray-400">— {new Date(doc.generatedAt).toLocaleDateString()}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {data.agreement.status === "not_sent" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Send Agreement</p>
                <div className="flex gap-2">
                  {(["email", "sms", "both"] as const).map(via => (
                    <button
                      key={via}
                      onClick={() => handleSend(via)}
                      disabled={sending}
                      className="flex-1 bg-[#FF6A00] text-white text-xs py-2 rounded-lg hover:bg-[#e55f00] disabled:opacity-50 capitalize"
                    >
                      {via === "both" ? "Email + SMS" : via.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {["sent", "delivered", "opened", "expired"].includes(data.agreement.status) && (
              <button
                onClick={handleResend}
                disabled={resendMutation.isPending}
                className="w-full border border-[#FF6A00] text-[#FF6A00] text-sm py-2 rounded-lg hover:bg-orange-50 disabled:opacity-50"
              >
                {resendMutation.isPending ? "Sending..." : "Send Reminder"}
              </button>
            )}

            {!["completed", "failed"].includes(data.agreement.status) && (
              <button
                onClick={handleRevoke}
                className="w-full border border-red-300 text-red-600 text-sm py-2 rounded-lg hover:bg-red-50"
              >
                Revoke Agreement
              </button>
            )}

            {data.events.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Audit Log</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {data.events.map(ev => (
                    <div key={ev.id} className="flex items-start gap-2 text-xs text-gray-600 py-1 border-b border-gray-100">
                      <span className="text-gray-400 whitespace-nowrap">{new Date(ev.createdAt).toLocaleString()}</span>
                      <span className="font-medium capitalize">{ev.eventType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bulk Progress Modal ──────────────────────────────────────────────────────

function BulkProgressModal({
  title,
  total,
  sent,
  failed,
  skipped,
  running,
  onClose,
}: {
  title: string;
  total: number;
  sent: number;
  failed: number;
  skipped?: number;
  running: boolean;
  onClose: () => void;
}) {
  const pct = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-semibold text-[#0b1228] mb-4">{title}</h3>
        <div className="space-y-3">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-[#FF6A00] h-2 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-xl font-bold text-green-700">{sent}</p>
              <p className="text-xs text-green-600">Sent</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-xl font-bold text-red-700">{failed}</p>
              <p className="text-xs text-red-600">Failed</p>
            </div>
            {skipped !== undefined && (
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xl font-bold text-gray-700">{skipped}</p>
                <p className="text-xs text-gray-600">Skipped</p>
              </div>
            )}
          </div>
          {running && (
            <p className="text-xs text-gray-400 text-center">Processing {total} members — please wait…</p>
          )}
        </div>
        {!running && (
          <button
            onClick={onClose}
            className="mt-4 w-full bg-[#0b1228] text-white text-sm py-2 rounded-lg hover:bg-[#1a2540]"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PIP Invoiced Toggle ────────────────────────────────────────────────────
function PipInvoicedToggle({ agreementId, invoiced, onToggle }: { agreementId: number; invoiced: boolean; onToggle: () => void }) {
  const markPipInvoiced = trpc.admin.agreements.markPipInvoiced.useMutation({
    onSuccess: () => { onToggle(); },
  });
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-xs font-semibold text-orange-600">PIP Elected</span>
      <button
        onClick={() => markPipInvoiced.mutate({ agreementId, invoiced: !invoiced })}
        disabled={markPipInvoiced.isPending}
        className={`text-xs px-2 py-0.5 rounded border font-medium transition-colors ${
          invoiced
            ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
            : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
        }`}
      >
        {markPipInvoiced.isPending ? '…' : invoiced ? '✓ Invoiced' : 'Not Invoiced'}
      </button>
    </div>
  );
}

// ─── Agreements Tab ───────────────────────────────────────────────────────────

function AgreementsTab({ origin }: { origin: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [bulkVia, setBulkVia] = useState<"email" | "sms" | "both">("email");
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [showBulkResend, setShowBulkResend] = useState(false);
  // Multi-select for targeted send
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showSendSelected, setShowSendSelected] = useState(false);
  const [sendSelectedProgress, setSendSelectedProgress] = useState<{
    title: string; total: number; sent: number; failed: number; running: boolean;
  } | null>(null);
  const sendToMembersMutation = trpc.admin.agreements.sendToMembers.useMutation();
  const [bulkProgress, setBulkProgress] = useState<{
    title: string; total: number; sent: number; failed: number; skipped?: number; running: boolean;
  } | null>(null);

  const { data, isLoading, refetch } = trpc.admin.agreements.list.useQuery({
    status: statusFilter || undefined,
    limit: 20,
    offset: page * 20,
  });

  const bulkSendMutation = trpc.admin.agreements.bulkSend.useMutation();
  const bulkResendMutation = trpc.admin.agreements.bulkResend.useMutation();
  const rowResendMutation = trpc.admin.agreements.resend.useMutation();
  const [remindingId, setRemindingId] = useState<number | null>(null);

  const handleRowRemind = async (agreementId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemindingId(agreementId);
    try {
      await rowResendMutation.mutateAsync({ agreementId, origin });
      toast.success("Reminder sent");
      refetch();
    } catch (err) {
      toast.error("Reminder failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRemindingId(null);
    }
  };

  const handleBulkSend = async () => {
    setShowBulkSend(false);
    setBulkProgress({ title: "Sending Agreements", total: 0, sent: 0, failed: 0, skipped: 0, running: true });
    try {
      const result = await bulkSendMutation.mutateAsync({ via: bulkVia, origin });
      setBulkProgress({ title: "Bulk Send Complete", total: result.total, sent: result.sent, failed: result.failed, skipped: result.skipped, running: false });
      refetch();
    } catch (err) {
      toast.error("Bulk send failed: " + (err instanceof Error ? err.message : String(err)));
      setBulkProgress(null);
    }
  };

  const handleBulkResend = async () => {
    setShowBulkResend(false);
    setBulkProgress({ title: "Sending Reminders", total: 0, sent: 0, failed: 0, running: true });
    try {
      const result = await bulkResendMutation.mutateAsync({
        statuses: ["sent", "expired"],
        via: bulkVia,
        origin,
      });
      setBulkProgress({ title: "Bulk Resend Complete", total: result.total, sent: result.sent, failed: result.failed, running: false });
      refetch();
    } catch (err) {
      toast.error("Bulk resend failed: " + (err instanceof Error ? err.message : String(err)));
      setBulkProgress(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
          >
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_LABELS) as AgreementStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button onClick={() => refetch()} className="text-sm text-gray-500 hover:text-gray-700">Refresh</button>
        </div>

        {/* Bulk actions */}
        <div className="flex gap-2 items-center">
          <select
            value={bulkVia}
            onChange={e => setBulkVia(e.target.value as "email" | "sms" | "both")}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Email + SMS</option>
          </select>
          <button
            onClick={() => setShowBulkSend(true)}
            className="bg-[#FF6A00] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#e55f00] transition-colors"
          >
            Bulk Send
          </button>
          <button
            onClick={() => setShowBulkResend(true)}
            className="bg-[#0b1228] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#1a2540] transition-colors"
          >
            Bulk Resend
          </button>
        </div>
      </div>

      {/* Bulk Send confirm */}
      {showBulkSend && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-800 mb-1">Confirm Bulk Send</p>
          <p className="text-xs text-orange-700 mb-3">
            This will generate and send agreements to <strong>all members who don't already have an active agreement</strong> via <strong>{bulkVia === "both" ? "Email + SMS" : bulkVia.toUpperCase()}</strong>. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={handleBulkSend} className="bg-[#FF6A00] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#e55f00]">
              Confirm — Send All
            </button>
            <button onClick={() => setShowBulkSend(false)} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Resend confirm */}
      {showBulkResend && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">Confirm Bulk Resend</p>
          <p className="text-xs text-blue-700 mb-3">
            This will send a reminder to all members with <strong>Sent</strong> or <strong>Expired</strong> agreements via <strong>{bulkVia === "both" ? "Email + SMS" : bulkVia.toUpperCase()}</strong>. Expired agreements will be extended 72 hours.
          </p>
          <div className="flex gap-2">
            <button onClick={handleBulkResend} className="bg-[#0b1228] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#1a2540]">
              Confirm — Resend All
            </button>
            <button onClick={() => setShowBulkResend(false)} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Send Selected bar */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-3 bg-[#0b1228] text-white px-4 py-3 rounded-xl">
          <span className="text-sm font-medium">{selectedRows.size} selected</span>
          <select
            value={bulkVia}
            onChange={e => setBulkVia(e.target.value as "email" | "sms" | "both")}
            className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Email + SMS</option>
          </select>
          <button
            onClick={() => setShowSendSelected(true)}
            className="bg-[#FF6A00] hover:bg-[#e55f00] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Send to Selected
          </button>
          <button
            onClick={() => setSelectedRows(new Set())}
            className="text-white/50 hover:text-white text-xs ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* Send Selected confirm */}
      {showSendSelected && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-medium text-orange-900 mb-3">
            Send agreement links to {selectedRows.size} selected member{selectedRows.size !== 1 ? "s" : ""} via {bulkVia === "both" ? "Email + SMS" : bulkVia.toUpperCase()}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setShowSendSelected(false);
                setSendSelectedProgress({ title: "Sending to Selected", total: selectedRows.size, sent: 0, failed: 0, running: true });
                try {
                  if (!sendToMembersMutation) { toast.error("sendToMembers not available"); return; }
                  const result = await sendToMembersMutation.mutateAsync({
                    memberIds: Array.from(selectedRows),
                    via: bulkVia,
                    origin,
                  });
                  setSendSelectedProgress({ title: "Send Complete", total: result.total, sent: result.sent, failed: result.failed, running: false });
                  setSelectedRows(new Set());
                  refetch();
                } catch (err) {
                  toast.error("Send failed: " + (err instanceof Error ? err.message : String(err)));
                  setSendSelectedProgress(null);
                }
              }}
              className="bg-[#FF6A00] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#e55f00]"
            >
              Confirm Send
            </button>
            <button onClick={() => setShowSendSelected(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedRows.size > 0 && selectedRows.size === (data?.rows?.length ?? 0)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(data?.rows?.map(r => r.agreement.memberId) ?? []));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reservation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">State</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">PIP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
              )}
              {!isLoading && (data?.rows?.length ?? 0) === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No agreements found</td></tr>
              )}
              {data?.rows?.map(row => (
                <tr
                  key={row.agreement.id}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedRows.has(row.agreement.memberId) ? "bg-orange-50" : ""}`}
                  onClick={() => setSelectedId(row.agreement.id)}
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedRows.has(row.agreement.memberId)}
                      onChange={e => {
                        const next = new Set(selectedRows);
                        if (e.target.checked) next.add(row.agreement.memberId);
                        else next.delete(row.agreement.memberId);
                        setSelectedRows(next);
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0b1228]">{row.member?.name ?? "—"}</p>
                    <p className="text-xs text-gray-500">{row.member?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{row.member?.reservationId ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{row.agreement.agreementState}</td>
                  <td className="px-4 py-3">
                    {/* Status timeline checkpoints */}
                    <div className="flex items-center gap-1">
                      {([
                        { key: "sent",     label: "Sent",     statuses: ["sent","delivered","opened","verified","in_progress","completed","expired"] as string[] },
                        { key: "opened",   label: "Opened",   statuses: ["opened","verified","in_progress","completed"] as string[] },
                        { key: "verified", label: "Verified", statuses: ["verified","in_progress","completed"] as string[] },
                        { key: "signed",   label: "Signed",   statuses: ["completed"] as string[] },
                      ]).map((step, i) => {
                        const done = step.statuses.includes(row.agreement.status);
                        return (
                          <div key={step.key} className="flex items-center">
                            {i > 0 && <div className={`w-4 h-px ${done ? "bg-[#FF6A00]" : "bg-gray-200"}`} />}
                            <div className="flex flex-col items-center gap-0.5">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                                done
                                  ? "bg-[#FF6A00] border-[#FF6A00] text-white"
                                  : "bg-white border-gray-300 text-gray-300"
                              }`}>
                                {done ? "✓" : ""}
                              </div>
                              <span className={`text-[9px] font-medium leading-none ${done ? "text-[#FF6A00]" : "text-gray-300"}`}>{step.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {row.agreement.hasException && (
                      <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600">! Exception</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.agreement.sentAt ? new Date(row.agreement.sentAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.agreement.expiresAt ? new Date(row.agreement.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {row.agreement.pipElected ? (
                      <PipInvoicedToggle agreementId={row.agreement.id} invoiced={row.agreement.pipInvoiced ?? false} onToggle={refetch} />
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedId(row.agreement.id)}
                        className="text-xs text-[#FF6A00] hover:underline"
                      >
                        View
                      </button>
                      {["sent","delivered","opened","expired"].includes(row.agreement.status) && (
                        <button
                          onClick={e => handleRowRemind(row.agreement.id, e)}
                          disabled={remindingId === row.agreement.id}
                          className="text-xs text-gray-500 hover:text-[#0b1228] border border-gray-300 rounded px-2 py-0.5 hover:border-[#0b1228] disabled:opacity-50 whitespace-nowrap"
                        >
                          {remindingId === row.agreement.id ? "Sending…" : "Remind"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data?.total ?? 0) > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {page * 20 + 1}–{Math.min((page + 1) * 20, data?.total ?? 0)} of {data?.total}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={(page + 1) * 20 >= (data?.total ?? 0)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {selectedId !== null && (
        <AgreementDetailDrawer
          agreementId={selectedId}
          onClose={() => { setSelectedId(null); refetch(); }}
          origin={origin}
        />
      )}

      {bulkProgress && (
        <BulkProgressModal
          {...bulkProgress}
          onClose={() => setBulkProgress(null)}
        />
      )}
      {sendSelectedProgress && (
        <BulkProgressModal
          {...sendSelectedProgress}
          onClose={() => setSendSelectedProgress(null)}
        />
      )}
    </div>
  );
}

// ─── Generate Agreement Tab ───────────────────────────────────────────────────

function GenerateTab({ origin }: { origin: string }) {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<{ id: number; name: string; email: string; reservationId: string } | null>(null);
  const [result, setResult] = useState<{ id: number; token: string; link: string; expiresAt: Date; memberName: string } | null>(null);
  const [expiresInHours, setExpiresInHours] = useState(72);

  const { data: members, isLoading: searching } = trpc.admin.members.list.useQuery(
    { search: search || undefined, limit: 8, offset: 0 },
    { enabled: search.length >= 2 }
  );

  const generateMutation = trpc.admin.agreements.generate.useMutation();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const r = await generateMutation.mutateAsync({ memberId: selectedMember.id, expiresInHours, origin });
      setResult({ ...r, link: `${origin}/agreement/${r.token}` });
      toast.success(`Agreement link generated for ${r.memberName}`);
    } catch (err) {
      toast.error("Failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-[#0b1228] mb-4">Generate Agreement Link</h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Member search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Member</label>
            <input
              type="text"
              value={selectedMember ? `${selectedMember.name} — ${selectedMember.reservationId}` : search}
              onChange={e => { setSearch(e.target.value); setSelectedMember(null); setResult(null); }}
              placeholder="Type name, email, or reservation ID..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              required
            />
            {/* Dropdown results */}
            {!selectedMember && search.length >= 2 && (
              <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg overflow-hidden">
                {searching && <p className="px-3 py-2 text-xs text-gray-400">Searching...</p>}
                {!searching && (members?.rows?.length ?? 0) === 0 && (
                  <p className="px-3 py-2 text-xs text-gray-400">No members found</p>
                )}
                {members?.rows?.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setSelectedMember({ id: m.id, name: m.name, email: m.email, reservationId: m.reservationId }); setSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-[#0b1228]">{m.name}</span>
                    <span className="text-gray-400 text-xs ml-2">#{m.id} · {m.reservationId}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link Expiry</label>
            <select
              value={expiresInHours}
              onChange={e => setExpiresInHours(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            >
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours (default)</option>
              <option value={168}>7 days</option>
              <option value={336}>14 days</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!selectedMember || generateMutation.isPending}
            className="w-full bg-[#FF6A00] text-white font-semibold py-2 rounded-lg hover:bg-[#e55f00] disabled:opacity-50 transition-colors"
          >
            {generateMutation.isPending ? "Generating..." : "Generate Link"}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-green-800 mb-1">Agreement link ready for {result.memberName}</p>
          <p className="text-xs text-green-600 mb-3">Expires: {new Date(result.expiresAt).toLocaleString()}</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={result.link}
              className="flex-1 border border-green-200 rounded-lg px-3 py-2 text-xs bg-white text-gray-700"
            />
            <button
              onClick={() => { navigator.clipboard.writeText(result.link); toast.success("Copied!"); }}
              className="bg-green-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-green-700"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-green-600 mt-3">
            Go to the <strong>Agreements</strong> tab to send this link via email or SMS.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

type Tab = "overview" | "members" | "agreements" | "generate";

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1228] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const role = user?.role ?? "user";
  if (!["admin", "manager", "readonly"].includes(role)) {
    return (
      <div className="min-h-screen bg-[#0b1228] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <img src="/manus-storage/whip-logo_215524ca.png" alt="Whip" className="h-12 w-auto mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "agreements", label: "Agreements" },
    { id: "generate", label: "Generate Link" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-[#0b1228] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <img src="/manus-storage/whip-logo_215524ca.png" alt="Whip" className="h-8 w-auto" />
            <span className="text-white/40 text-sm hidden sm:block">Agreement Admin</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Agent Demo Walkthrough — prefilled test agreement for agents */}
            <a
              href="/agreement?mode=demo&prefill=1"
              title="Walk through the member agreement as a customer would"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#FF6A00] hover:bg-[#e55f00] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="hidden sm:inline">Agent Demo</span>
            </a>
            <span className="text-white/60 text-sm hidden sm:block">{user?.name ?? user?.email}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              role === "admin" ? "bg-[#FF6A00] text-white" :
              role === "manager" ? "bg-blue-500 text-white" :
              "bg-gray-600 text-white"
            }`}>
              {role}
            </span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-[#FF6A00] text-[#FF6A00]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === "overview" && <OverviewTab />}
        {tab === "members" && <MembersTab />}
        {tab === "agreements" && <AgreementsTab origin={origin} />}
        {tab === "generate" && <GenerateTab origin={origin} />}
      </main>
    </div>
  );
}
