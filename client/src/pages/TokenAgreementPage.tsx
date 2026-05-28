/**
 * TokenAgreementPage — renders when a member opens a secure agreement link.
 * Route: /agreement/:token
 *
 * Flow:
 *  1. Load agreement metadata via token (public endpoint).
 *  2. Track the "opened" event.
 *  3. Show a verification gate (DOB or last-4 of DL).
 *  4. On success, hand off to AgreementPage in "token mode" with pre-filled data.
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import AgreementPage from "./AgreementPage";

// ─── Verification Gate ────────────────────────────────────────────────────────

function VerificationGate({
  token,
  memberName,
  onVerified,
}: {
  token: string;
  memberName?: string;
  onVerified: (memberData: Record<string, string>) => void;
}) {
  const [method, setMethod] = useState<"dob" | "dl_last4">("dob");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyMutation = trpc.admin.verify.verifyToken.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await verifyMutation.mutateAsync({
        token,
        method,
        value: value.trim(),
        ipAddress: undefined,
        userAgent: navigator.userAgent,
      });
      if (result.verified && result.member) {
        onVerified(result.member as Record<string, string>);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg.replace(/^TRPCClientError: /, ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1228] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/manus-storage/whip-logo_215524ca.png" alt="Whip" className="h-14 w-auto mx-auto" />
          <p className="text-gray-500 text-sm mt-2">Member Agreement Portal</p>
        </div>

        {memberName && (
          <div className="bg-[#0b1228]/5 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-gray-600">Agreement for</p>
            <p className="font-semibold text-[#0b1228] text-lg">{memberName}</p>
          </div>
        )}

        <h2 className="text-xl font-bold text-[#0b1228] mb-2">Verify Your Identity</h2>
        <p className="text-gray-500 text-sm mb-6">
          To protect your information, please verify your identity before accessing your agreement.
        </p>

        {/* Method toggle */}
        <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            type="button"
            onClick={() => { setMethod("dob"); setValue(""); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${method === "dob" ? "bg-[#0b1228] text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Date of Birth
          </button>
          <button
            type="button"
            onClick={() => { setMethod("dl_last4"); setValue(""); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${method === "dl_last4" ? "bg-[#0b1228] text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Last 4 of DL
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {method === "dob" ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last 4 digits of Driver's License</label>
              <input
                type="text"
                value={value}
                onChange={e => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="e.g. 6789"
                maxLength={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] tracking-widest text-center text-lg"
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="w-full bg-[#FF6A00] hover:bg-[#e55f00] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Verifying..." : "Verify & Access Agreement"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Having trouble? Contact your local Whip office for assistance.
        </p>
      </div>
    </div>
  );
}

// ─── Expired / Revoked / Error States ────────────────────────────────────────

function AgreementError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0b1228] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        <img src="/manus-storage/whip-logo_215524ca.png" alt="Whip" className="h-12 w-auto mx-auto" />
        <div className="mt-8 mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link Unavailable</h2>
          <p className="text-gray-500 text-sm">{message}</p>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Please contact your local Whip office to get a new agreement link.
        </p>
      </div>
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function AgreementLoading() {
  return (
    <div className="min-h-screen bg-[#0b1228] flex items-center justify-center">
      <div className="text-center">
        <img src="/manus-storage/whip-logo_215524ca.png" alt="Whip" className="h-12 w-auto mx-auto" />
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-white/60 text-sm mt-4">Loading your agreement...</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TokenAgreementPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  const [verified, setVerified] = useState(false);
  const [memberData, setMemberData] = useState<Record<string, string> | null>(null);
  const [tracked, setTracked] = useState(false);

  const { data, isLoading, error } = trpc.admin.verify.getAgreementByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const trackOpen = trpc.admin.verify.trackOpen.useMutation();

  useEffect(() => {
    if (data && !tracked) {
      setTracked(true);
      trackOpen.mutate({ token, userAgent: navigator.userAgent });
    }
  }, [data, tracked, token]);

  if (!token) return <AgreementError message="Invalid agreement link. Please check the URL and try again." />;
  if (isLoading) return <AgreementLoading />;
  if (error) {
    const msg = error.message.replace(/^TRPCClientError: /, "");
    return <AgreementError message={msg} />;
  }
  if (!data) return <AgreementError message="Agreement not found." />;

  if (!verified) {
    return (
      <VerificationGate
        token={token}
        memberName={data.memberName}
        onVerified={(md) => {
          setMemberData(md);
          setVerified(true);
        }}
      />
    );
  }

  // Pass member data directly as props — no URL manipulation needed
  if (!memberData) return <AgreementLoading />;

  const toISODate = (v: string | null | undefined) => {
    if (!v) return "";
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    return v;
  };

  const initialFields = {
    memberName: memberData.name ?? "",
    dob: toISODate(memberData.dob),
    phone: memberData.phone ?? "",
    email: memberData.email ?? "",
    dlNumber: memberData.driverLicense ?? "",
    licenseState: memberData.licenseState ?? "",
    address: memberData.address ?? "",
    cityStateZip: memberData.cityStateZip ?? "",
    customerId: memberData.customerId ?? "",
    reservationId: memberData.reservationId ?? "",
    vehicle: memberData.vehicle ?? "",
    vin: memberData.vin ?? "",
    weeklyFee: memberData.weeklyRate ?? "",
    deposit: memberData.deposit ?? "",
    agreementState: memberData.agreementState ?? "",
    startDate: toISODate(memberData.startDate),
    endDate: toISODate(memberData.endDate),
  };

  const initialPrefilled = new Set(
    Object.entries(initialFields)
      .filter(([, v]) => v !== "")
      .map(([k]) => k)
  );

  return (
    <AgreementPage
      initialFields={initialFields}
      initialPrefilled={initialPrefilled}
      tokenMode={true}
      agreementToken={token}
    />
  );
}
