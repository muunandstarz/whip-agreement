/**
 * AdminDashboard — Whip Agreement Back-Office Platform
 *
 * Tabs:
 *  Overview  — metrics cards + exception queue + recent activity
 *  Members   — import (CSV / manual) + member list
 *  Agreements — pipeline board + search + detail drawer
 *  Settings  — (placeholder)
 */

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

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

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading metrics...</div>;

  const m = metrics;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Agreements" value={m?.total ?? 0} />
        <MetricCard label="Completion Rate" value={`${m?.completionRate ?? 0}%`} accent />
        <MetricCard label="Avg. Time to Sign" value={`${m?.avgMinutesToSign ?? 0}m`} sub="minutes" />
        <MetricCard label="Open Exceptions" value={m?.exceptions ?? 0} sub="need review" />
      </div>

      {/* Status pipeline */}
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

      {/* Exception queue */}
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
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

const MEMBER_CSV_HEADERS = [
  "name", "dob", "phone", "email", "driverLicense", "licenseState",
  "address", "cityStateZip", "customerId", "reservationId", "vehicle",
  "vin", "weeklyRate", "deposit", "agreementState", "startDate", "endDate",
];

function MembersTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showManual, setShowManual] = useState(false);
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
    vin: "", weeklyRate: "", deposit: "", agreementState: "", startDate: "", endDate: "",
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

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMember.mutateAsync(form as Parameters<typeof createMember.mutateAsync>[0]);
      toast.success("Member created");
      setShowManual(false);
      setForm({ name: "", dob: "", phone: "", email: "", driverLicense: "", licenseState: "", address: "", cityStateZip: "", customerId: "", reservationId: "", vehicle: "", vin: "", weeklyRate: "", deposit: "", agreementState: "", startDate: "", endDate: "" });
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
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  required
                />
              </div>
            ))}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reservation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">State</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              )}
              {!isLoading && (data?.rows?.length ?? 0) === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No members found</td></tr>
              )}
              {data?.rows?.map(member => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0b1228]">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{member.customerId}</td>
                  <td className="px-4 py-3 text-gray-600">{member.reservationId}</td>
                  <td className="px-4 py-3 text-gray-600">{member.vehicle}</td>
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
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
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
  const generateMutation = trpc.admin.agreements.generate.useMutation();

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#0b1228]">
          <h2 className="font-semibold text-white">Agreement #{agreementId}</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">×</button>
        </div>

        {isLoading && <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>}

        {data && (
          <div className="flex-1 p-6 space-y-5">
            {/* Status */}
            <div className="flex items-center gap-3">
              <StatusBadge status={data.agreement.status} />
              {data.agreement.hasException && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Exception</span>
              )}
            </div>

            {/* Member info */}
            {data.member && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-[#0b1228]">{data.member.name}</p>
                <p className="text-sm text-gray-600">{data.member.email} · {data.member.phone}</p>
                <p className="text-sm text-gray-600">{data.member.vehicle} ({data.member.vin?.slice(-6)})</p>
                <p className="text-sm text-gray-600">Res: {data.member.reservationId} · State: {data.member.agreementState}</p>
              </div>
            )}

            {/* Agreement link */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Agreement Link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={agreementLink}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs bg-gray-50 text-gray-700"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(agreementLink); toast.success("Link copied"); }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-lg"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Actions</p>
              <div className="flex flex-wrap gap-2">
                {["not_sent", "expired"].includes(data.agreement.status) ? (
                  <>
                    <button onClick={() => handleSend("email")} disabled={sending} className="bg-[#FF6A00] text-white text-sm px-3 py-2 rounded-lg hover:bg-[#e55f00] disabled:opacity-50">
                      Send via Email
                    </button>
                    <button onClick={() => handleSend("sms")} disabled={sending} className="bg-[#0b1228] text-white text-sm px-3 py-2 rounded-lg hover:bg-[#1a2540] disabled:opacity-50">
                      Send via SMS
                    </button>
                    <button onClick={() => handleSend("both")} disabled={sending} className="bg-white border border-gray-300 text-gray-700 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      Send Both
                    </button>
                  </>
                ) : ["sent", "delivered", "opened", "verified", "in_progress"].includes(data.agreement.status) ? (
                  <button onClick={handleResend} disabled={resendMutation.isPending} className="bg-[#FF6A00] text-white text-sm px-3 py-2 rounded-lg hover:bg-[#e55f00] disabled:opacity-50">
                    Send Reminder
                  </button>
                ) : null}

                {!["completed", "failed"].includes(data.agreement.status) && (
                  <button onClick={handleRevoke} disabled={revokeMutation.isPending} className="bg-red-50 text-red-700 border border-red-200 text-sm px-3 py-2 rounded-lg hover:bg-red-100 disabled:opacity-50">
                    Revoke
                  </button>
                )}
              </div>
            </div>

            {/* Timeline */}
            {data.events && data.events.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Audit Log</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...data.events].reverse().map(ev => (
                    <div key={ev.id} className="flex gap-3 text-xs">
                      <div className="w-2 h-2 bg-[#FF6A00] rounded-full mt-1 shrink-0" />
                      <div>
                        <span className="font-medium text-[#0b1228]">{ev.eventType.replace(/_/g, " ")}</span>
                        <span className="text-gray-400 ml-2">{new Date(ev.createdAt).toLocaleString()}</span>
                        {ev.ipAddress && <span className="text-gray-400 ml-2">· {ev.ipAddress}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {data.documents && data.documents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Documents</p>
                <div className="space-y-1">
                  {data.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                      <span className="text-gray-700">{doc.documentType.replace(/_/g, " ")}</span>
                      <a href={doc.s3Url} target="_blank" rel="noreferrer" className="text-[#FF6A00] hover:underline">View</a>
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

// ─── Agreements Tab ───────────────────────────────────────────────────────────

function AgreementsTab({ origin }: { origin: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);

  const { data, isLoading, refetch } = trpc.admin.agreements.list.useQuery({
    status: statusFilter || undefined,
    limit: 20,
    offset: page * 20,
  });

  const generateMutation = trpc.admin.agreements.generate.useMutation();

  const handleGenerate = async (memberId: number) => {
    setGenerating(memberId);
    try {
      const result = await generateMutation.mutateAsync({ memberId });
      toast.success("Agreement link generated");
      refetch();
      setSelectedId(result.id);
    } catch (err) {
      toast.error("Failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reservation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">State</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              )}
              {!isLoading && (data?.rows?.length ?? 0) === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No agreements found</td></tr>
              )}
              {data?.rows?.map(row => (
                <tr
                  key={row.agreement.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedId(row.agreement.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0b1228]">{row.member?.name ?? "—"}</p>
                    <p className="text-xs text-gray-500">{row.member?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.member?.reservationId ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{row.agreement.agreementState}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.agreement.status} />
                    {row.agreement.hasException && (
                      <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600">!</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.agreement.sentAt ? new Date(row.agreement.sentAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.agreement.expiresAt ? new Date(row.agreement.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedId(row.agreement.id)}
                      className="text-xs text-[#FF6A00] hover:underline"
                    >
                      View
                    </button>
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

      {/* Detail drawer */}
      {selectedId !== null && (
        <AgreementDetailDrawer
          agreementId={selectedId}
          onClose={() => { setSelectedId(null); refetch(); }}
          origin={origin}
        />
      )}
    </div>
  );
}

// ─── Generate Agreement Panel ─────────────────────────────────────────────────

function GenerateTab({ origin }: { origin: string }) {
  const [memberId, setMemberId] = useState("");
  const [result, setResult] = useState<{ id: number; token: string; link: string; expiresAt: Date } | null>(null);
  const generateMutation = trpc.admin.agreements.generate.useMutation();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(memberId);
    if (!id) return;
    try {
      const r = await generateMutation.mutateAsync({ memberId: id });
      setResult({ ...r, link: `${origin}/agreement/${r.token}` });
      toast.success("Agreement link generated");
    } catch (err) {
      toast.error("Failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-[#0b1228] mb-4">Generate Agreement Link</h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member ID</label>
            <input
              type="number"
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              placeholder="e.g. 42"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Find the member ID in the Members tab</p>
          </div>
          <button
            type="submit"
            disabled={generateMutation.isPending}
            className="w-full bg-[#FF6A00] text-white font-semibold py-2 rounded-lg hover:bg-[#e55f00] disabled:opacity-50"
          >
            {generateMutation.isPending ? "Generating..." : "Generate Link"}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-green-800 mb-3">Agreement link ready</p>
          <div className="flex gap-2 mb-3">
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
          <p className="text-xs text-green-700">Expires: {new Date(result.expiresAt).toLocaleString()}</p>
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
