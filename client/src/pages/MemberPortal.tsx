// MemberPortal.tsx
// Post-signing member portal: Dashboard, Vehicles, Trip History, Invoicing, Support, Profile
// Design: Navy/orange Whip brand, card-based, mobile-first

import { useState } from 'react';
import {
  getMarketForState, getCoverageForState, HELP_DESK_TEXT_LINE,
  buildDemoTripHistory, buildDemoInvoice,
  type TripRecord, type InvoiceLineItem, type PastInvoice,
} from '@/lib/agreementData';

// ── TYPES ────────────────────────────────────────────────────────────────────
interface MemberFields {
  memberName: string; dob: string; phone: string; email: string;
  dlNumber: string; licenseState: string; address: string; cityStateZip: string;
  customerId: string; reservationId: string; vehicle: string; vin: string;
  weeklyFee: string; deposit: string; startDate: string; endDate: string;
  agreementState: string; printedName: string; dateSigned: string;
}

interface PortalProps {
  fields: MemberFields;
  onPrint: () => void;
  onPrintAddon: (addonKey: string) => void;
  addons: string[];
  pipElection: 'full' | 'waive' | null;
}

// ── ICONS ────────────────────────────────────────────────────────────────────
const DashIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const CarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const HistoryIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
    <polyline points="12 7 12 12 15 15"/>
  </svg>
);
const InvoiceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2"/>
    <line x1="7" y1="8" x2="17" y2="8"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
    <line x1="7" y1="16" x2="13" y2="16"/>
  </svg>
);
const SupportIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ProfileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const ShieldIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 15.01 9 12.01"/>
  </svg>
);

// ── HELPERS ──────────────────────────────────────────────────────────────────
function parseVehicle(vehicle: string) {
  const parts = vehicle.trim().split(/\s+/);
  const year = parts[0] || '';
  const make = parts[1] || '';
  const model = parts.slice(2).join(' ') || '';
  return { year, make, model };
}

function formatDate(d: string) {
  if (!d) return '—';
  try {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

function last6(vin: string) {
  return vin ? vin.slice(-6).toUpperCase() : '——————';
}

function CarSilhouette({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? { w: 64, h: 28 } : size === 'lg' ? { w: 160, h: 70 } : { w: 120, h: 52 };
  return (
    <svg viewBox="0 0 200 80" width={dims.w} height={dims.h} xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Main body */}
      <path d="M16 52 L16 38 Q16 33 21 33 L52 33 L70 15 L130 15 L148 33 L179 33 Q184 33 184 38 L184 52 Z" />
      {/* Cabin / roof */}
      <path d="M72 33 L82 17 L118 17 L128 33" />
      {/* Center door divider */}
      <line x1="100" y1="33" x2="100" y2="52" />
      {/* Front wheel arch */}
      <path d="M34 52 Q34 65 50 65 Q66 65 66 52" />
      {/* Rear wheel arch */}
      <path d="M134 52 Q134 65 150 65 Q166 65 166 52" />
      {/* Front bumper */}
      <line x1="16" y1="45" x2="8" y2="45" />
      {/* Rear bumper */}
      <line x1="184" y1="45" x2="192" y2="45" />
      {/* Side mirror */}
      <path d="M148 33 L155 29 L159 33" />
    </svg>
  );
}

// Outline silhouette — no fill colors needed

// ── POI CARD ─────────────────────────────────────────────────────────────────
function PoiCard({ fields }: { fields: MemberFields }) {
  const [flipped, setFlipped] = useState(false);
  const { year, make, model } = parseVehicle(fields.vehicle);
  const today = new Date();
  const effectiveDate = fields.startDate ? formatDate(fields.startDate) : today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  const expDate = fields.endDate ? formatDate(fields.endDate) : new Date(today.setFullYear(today.getFullYear() + 1)).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

  return (
    <div onClick={() => setFlipped(f => !f)} style={{ perspective: 1000, cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}>
      <div style={{
        position: 'relative', width: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        minHeight: 220,
      }}>
        {/* FRONT */}
        <div style={{
          position: flipped ? 'absolute' : 'relative', inset: flipped ? 0 : undefined,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', gap: 10,
          width: '100%', boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.01em' }}>Assurant Claim</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>State of {fields.agreementState || 'Maryland'}</div>
              </div>
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>Tap to flip</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
            INSURANCE IDENTIFICATION CARD
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 11 }}>
            <div><div style={{ color: '#64748b', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>POLICY NUMBER</div><div style={{ color: '#0f172a', fontWeight: 600 }}>{fields.reservationId || 'S0137'}</div></div>
            <div />
            <div><div style={{ color: '#64748b', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>EFFECTIVE DATE</div><div style={{ color: '#0f172a', fontWeight: 600 }}>{effectiveDate}</div></div>
            <div><div style={{ color: '#64748b', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>EXPIRATION DATE</div><div style={{ color: '#0f172a', fontWeight: 600 }}>{expDate}</div></div>
            <div style={{ gridColumn: '1 / -1' }}><div style={{ color: '#64748b', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>VIN</div><div style={{ color: '#0f172a', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{fields.vin || '—'}</div></div>
            <div><div style={{ color: '#64748b', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>YEAR</div><div style={{ color: '#0f172a', fontWeight: 600 }}>{year}</div></div>
            <div><div style={{ color: '#64748b', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>MAKE</div><div style={{ color: '#0f172a', fontWeight: 600 }}>{make.toUpperCase()}</div></div>
            <div style={{ gridColumn: '1 / -1' }}><div style={{ color: '#64748b', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>MODEL</div><div style={{ color: '#0f172a', fontWeight: 600 }}>{model.toUpperCase()}</div></div>
            <div style={{ gridColumn: '1 / -1' }}><div style={{ color: '#64748b', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em' }}>NAMED INSURED</div><div style={{ color: '#0f172a', fontWeight: 600 }}>METROCARS LEASING CORP</div><div style={{ color: '#0f172a', fontSize: 10 }}>14670 SOUTHLAWN LANE · ROCKVILLE MD 20850</div></div>
          </div>
        </div>
        {/* BACK */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)', background: '#1e3a8a', borderRadius: 12, padding: '20px 22px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', gap: 12, color: 'white',
          minHeight: 220,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 8 }}>IN CASE OF ACCIDENT</div>
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ marginBottom: 6 }}><strong>1.</strong> Call 911 if anyone is injured</div>
            <div style={{ marginBottom: 6 }}><strong>2.</strong> Exchange insurance info with all parties</div>
            <div style={{ marginBottom: 6 }}><strong>3.</strong> Report to Whip within 24 hours:</div>
            <div style={{ paddingLeft: 16, marginBottom: 4 }}>📞 <strong>855-861-9401</strong></div>
            <div style={{ paddingLeft: 16 }}>🌐 drivewhip.com → File a Claim</div>
          </div>
          <div style={{ marginTop: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 8 }}>
            Policy: {fields.reservationId || '—'} · Assurant · Metrocars Leasing Corp.
          </div>
        </div>
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 6 }}>Tap card to flip</p>
    </div>
  );
}

// ── DASHBOARD PAGE ────────────────────────────────────────────────────────────
function DashboardPage({ fields, addons, onPrint, onPrintAddon }: {
  fields: MemberFields; addons: string[];
  onPrint: () => void; onPrintAddon: (key: string) => void;
}) {
  const market = getMarketForState(fields.agreementState);
  const { year, make, model } = parseVehicle(fields.vehicle);
  const signedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const docs: { label: string; onView: () => void }[] = [
    { label: 'Member Agreement', onView: onPrint },
    ...(addons.includes('md-pip') ? [{ label: 'Maryland PIP Waiver', onView: () => onPrintAddon('md-pip') }] : []),
    ...(addons.includes('ga-um') ? [{ label: 'Georgia UM Rejection', onView: () => onPrintAddon('ga-um') }] : []),
    ...(addons.includes('fl-um') ? [{ label: 'Florida UM/UIM Rejection', onView: () => onPrintAddon('fl-um') }] : []),
    ...(addons.includes('pa-pip') ? [{ label: 'Pennsylvania Coverage Election', onView: () => onPrintAddon('pa-pip') }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
      {/* Welcome header */}
      <div style={{ background: '#171b31', borderRadius: 12, padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,98,33,0.18)', border: '2px solid rgba(255,98,33,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6221" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
            {fields.memberName ? `Hi, ${fields.memberName.split(' ')[0]}` : 'Welcome'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Member since {signedDate}</div>
        </div>
      </div>

      {/* Reservation details */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Reservation</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Customer ID', value: fields.customerId || '—' },
            { label: 'Reservation ID', value: fields.reservationId || '—' },
            { label: 'Start Date', value: formatDate(fields.startDate) },
            { label: 'End Date', value: formatDate(fields.endDate) },
            { label: 'Weekly Fee', value: fields.weeklyFee ? `$${fields.weeklyFee}` : '—' },
            { label: 'Deposit', value: fields.deposit ? `$${fields.deposit}` : '—' },
          ].map(({ label, value }, i, arr) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', fontFamily: label.includes('ID') ? 'monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle snapshot */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Vehicle</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'var(--muted)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6221' }}>
              <CarSilhouette size="md" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{year} {make}</div>
              <div style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>{model}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'monospace', marginTop: 2 }}>{fields.vin || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Market location */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Your Market</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6 }}>{market.name}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <span style={{ color: 'var(--muted-foreground)', marginTop: 1 }}><MapPinIcon /></span>
            <span style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{market.address}, {market.city}, {market.state} {market.zip}</span>
          </div>
          <a href={`tel:${market.phone.replace(/\D/g, '')}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ color: '#ff6221' }}><PhoneIcon /></span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ff6221' }}>{market.phone}</span>
          </a>
        </div>
      </div>

      {/* My Documents */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>My Documents</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {docs.map(({ label, onView }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < docs.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff7f4', border: '1px solid #ffe4d9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ff6221' }}>
                <FileIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Signed {signedDate}</div>
              </div>
              <button onClick={onView} style={{ fontSize: 12, color: '#ff6221', fontWeight: 700, background: 'none', border: 'none', padding: '4px 8px', flexShrink: 0, cursor: 'pointer' }}>View</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── VEHICLES PAGE ─────────────────────────────────────────────────────────────
function VehiclesPage({ fields, addons, pipElection }: {
  fields: MemberFields; addons: string[]; pipElection: 'full' | 'waive' | null;
}) {
  const { year, make, model } = parseVehicle(fields.vehicle);
  const coverage = getCoverageForState(fields.agreementState);
  const [poiOpen, setPoiOpen] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
      {/* Vehicle hero */}
      <div style={{ background: '#171b31', borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#ff6221' }}>
          <CarSilhouette size="lg" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{year} {make}</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>{model}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{fields.vin || '—'}</div>
      </div>

      {/* Vehicle details */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Vehicle Details</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Year', value: year },
            { label: 'Make', value: make },
            { label: 'Model', value: model },
            { label: 'VIN', value: fields.vin || '—', mono: true },
            { label: 'Reservation ID', value: fields.reservationId || '—', mono: true },
          ].map(({ label, value, mono }, i, arr) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Proof of Insurance */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Proof of Insurance</div>
        <button onClick={() => setPoiOpen(true)} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldIcon color="#1d4ed8" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>Insurance ID Card</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Assurant · Tap to view</div>
          </div>
          <span style={{ color: 'var(--muted-foreground)' }}><ChevronRight /></span>
        </button>
      </div>

      {/* Coverage breakdown */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Coverage Breakdown</div>

        {/* Protection Plan */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldIcon color="#16a34a" /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{coverage.protectionPlan.name}</div>
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Active</div>
            </div>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 10px', lineHeight: 1.5 }}>{coverage.protectionPlan.description}</p>
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#713f12', marginBottom: 10 }}>
              <strong>Your responsibility:</strong> {coverage.protectionPlan.memberResponsibility}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: 4 }}>Not covered:</div>
            {coverage.protectionPlan.exclusions.map(ex => (
              <div key={ex} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 3 }}>
                <span style={{ color: '#ef4444', marginTop: 1 }}>✕</span> {ex}
              </div>
            ))}
          </div>
        </div>

        {/* Liability */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldIcon color="#1d4ed8" /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>Liability Coverage</div>
              <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>Through Metro Cars</div>
            </div>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>{coverage.liability.limits}</div>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>{coverage.liability.description}</p>
          </div>
        </div>

        {/* PIP */}
        {coverage.pip && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: addons.includes('md-pip') && pipElection === 'waive' ? '#fef2f2' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldIcon color={addons.includes('md-pip') && pipElection === 'waive' ? '#ef4444' : '#16a34a'} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{coverage.pip.name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: addons.includes('md-pip') && pipElection === 'waive' ? '#ef4444' : '#16a34a' }}>
                  {addons.includes('md-pip') ? (pipElection === 'waive' ? 'Waived' : pipElection === 'full' ? 'Elected' : 'Pending Election') : coverage.pip.limit}
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 6px', lineHeight: 1.5 }}>{coverage.pip.description}</p>
              <div style={{ fontSize: 12, color: 'var(--foreground)', fontWeight: 600 }}>Limit: {coverage.pip.limit}</div>
            </div>
          </div>
        )}

        {/* UM */}
        {coverage.um && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldIcon color="#ef4444" /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{coverage.um.name}</div>
                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Rejected</div>
              </div>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 6px', lineHeight: 1.5 }}>{coverage.um.description}</p>
              <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{coverage.um.status}</div>
            </div>
          </div>
        )}
      </div>

      {/* POI Modal */}
      {poiOpen && (
        <div onClick={() => setPoiOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
            <PoiCard fields={fields} />
            <button onClick={() => setPoiOpen(false)} style={{ marginTop: 12, width: '100%', padding: '12px', borderRadius: 10, background: 'white', border: 'none', fontSize: 14, fontWeight: 700, color: '#171b31', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TRIP HISTORY PAGE ─────────────────────────────────────────────────────────
const TRIP_TYPE_CONFIG = {
  reservation: { label: 'Reservation', bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', dot: '#3b82f6' },
  swap:        { label: 'Swap',        bg: '#fff7ed', border: '#fed7aa', color: '#c2410c', dot: '#f97316' },
  loaner:      { label: 'Loaner',      bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e' },
};

function TripCard({ trip, isActive }: { trip: TripRecord; isActive: boolean }) {
  const { year, make, model } = parseVehicle(trip.vehicle);
  const cfg = TRIP_TYPE_CONFIG[trip.type];
  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${isActive ? '#ff6221' : 'var(--border)'}`,
      borderRadius: 12, overflow: 'hidden',
      boxShadow: isActive ? '0 0 0 2px rgba(255,98,33,0.15)' : 'none',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        {/* Car silhouette small */}
        <div style={{ background: 'var(--muted)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isActive ? '#ff6221' : 'var(--muted-foreground)' }}>
          <CarSilhouette size="sm" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{year} {make} {model}</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'monospace', marginTop: 2 }}>···{last6(trip.vin)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: '2px 10px' }}>{cfg.label}</span>
          {isActive && <span style={{ fontSize: 10, fontWeight: 700, color: '#ff6221', background: 'rgba(255,98,33,0.1)', borderRadius: 20, padding: '2px 8px' }}>Active</span>}
        </div>
      </div>
      {/* Date row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
          {formatDate(trip.startDate)} — {trip.endDate ? formatDate(trip.endDate) : <span style={{ color: '#ff6221', fontWeight: 700 }}>Present</span>}
        </span>
      </div>
      {trip.notes && (
        <div style={{ padding: '0 16px 12px', fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{trip.notes}</div>
      )}
    </div>
  );
}

function TripHistoryPage({ fields }: { fields: MemberFields }) {
  const trips = buildDemoTripHistory(fields.vehicle, fields.vin, fields.startDate, fields.endDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ background: '#171b31', borderRadius: 12, padding: '20px 18px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 4 }}>Trip History</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{trips.length} vehicles · All reservations, swaps &amp; loaners</div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(Object.entries(TRIP_TYPE_CONFIG) as [string, typeof TRIP_TYPE_CONFIG['reservation']][]).map(([type, cfg]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot }} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 19, top: 24, bottom: 24, width: 2, background: 'var(--border)', zIndex: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trips.map((trip, i) => {
            const isActive = !trip.endDate;
            const cfg = TRIP_TYPE_CONFIG[trip.type];
            return (
              <div key={trip.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                {/* Timeline dot */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? '#ff6221' : cfg.bg,
                  border: `2px solid ${isActive ? '#ff6221' : cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isActive ? '0 0 0 4px rgba(255,98,33,0.15)' : 'none',
                }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={isActive ? 'white' : cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2"/>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TripCard trip={trip} isActive={isActive} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Reservations', value: trips.filter(t => t.type === 'reservation').length, color: '#3b82f6' },
            { label: 'Swaps', value: trips.filter(t => t.type === 'swap').length, color: '#f97316' },
            { label: 'Loaners', value: trips.filter(t => t.type === 'loaner').length, color: '#22c55e' },
          ].map(({ label, value, color: c }) => (
            <div key={label} style={{ textAlign: 'center', padding: '10px 0', background: 'var(--muted)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── INVOICING PAGE ────────────────────────────────────────────────────────────
const INVOICE_TYPE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  weekly: { bg: '#eff6ff', color: '#1d4ed8', label: 'Weekly' },
  ticket: { bg: '#fef2f2', color: '#dc2626', label: 'Ticket' },
  toll:   { bg: '#fff7ed', color: '#c2410c', label: 'Toll' },
  late:   { bg: '#fefce8', color: '#a16207', label: 'Late Fee' },
  credit: { bg: '#f0fdf4', color: '#15803d', label: 'Credit' },
};

function InvoicingPage({ fields }: { fields: MemberFields }) {
  const invoice = buildDemoInvoice(fields.weeklyFee, fields.startDate);
  const [expandedPast, setExpandedPast] = useState(false);

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20, position: 'relative' }}>
      {/* Current Balance Card */}
      <div style={{ background: '#171b31', borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Current Balance Due</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: '#ff6221', lineHeight: 1, marginBottom: 8 }}>{fmt(invoice.currentBalance)}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Due {invoice.dueDate}</div>
        <button style={{
          marginTop: 16, padding: '12px 32px', borderRadius: 10, border: 'none',
          background: '#ff6221', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          width: '100%',
        }}>
          Pay Now
        </button>
      </div>

      {/* Line Items */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Current Charges</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {invoice.lineItems.map((item: InvoiceLineItem, i) => {
            const cfg = INVOICE_TYPE_COLORS[item.type] ?? INVOICE_TYPE_COLORS.weekly;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < invoice.lineItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color }}>{cfg.label.slice(0, 3).toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{item.label}</div>
                  {(item.date || item.note) && (
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                      {item.date}{item.date && item.note ? ' · ' : ''}{item.note}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: item.type === 'credit' ? '#16a34a' : 'var(--foreground)', flexShrink: 0 }}>
                  {item.type === 'credit' ? '-' : ''}{fmt(item.amount)}
                </div>
              </div>
            );
          })}
          {/* Total row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--muted)', borderTop: '2px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--foreground)' }}>Total Due</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#ff6221' }}>{fmt(invoice.currentBalance)}</span>
          </div>
        </div>
      </div>

      {/* Past Invoices */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Invoice History</div>
          <button onClick={() => setExpandedPast(e => !e)} style={{ fontSize: 12, color: '#ff6221', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
            {expandedPast ? 'Show Less' : 'Show All'}
          </button>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {(expandedPast ? invoice.pastInvoices : invoice.pastInvoices.slice(0, 3)).map((inv: PastInvoice, i, arr) => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircleIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', fontFamily: 'monospace' }}>{inv.id}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{inv.period}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{fmt(inv.total)}</div>
                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Paid {inv.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PROFILE PAGE ──────────────────────────────────────────────────────────────
function ProfilePage({ fields, onUpdateField }: {
  fields: MemberFields;
  onUpdateField: (k: 'phone' | 'email', v: string) => void;
}) {
  const market = getMarketForState(fields.agreementState);
  const [editPhone, setEditPhone] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [phoneVal, setPhoneVal] = useState(fields.phone);
  const [emailVal, setEmailVal] = useState(fields.email);

  const savePhone = () => { onUpdateField('phone', phoneVal); setEditPhone(false); };
  const saveEmail = () => { onUpdateField('email', emailVal); setEditEmail(false); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0 4px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#171b31', border: '3px solid #ff6221', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>
            {fields.memberName ? fields.memberName.charAt(0).toUpperCase() : '?'}
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>{fields.memberName || '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Member · {fields.agreementState || '—'}</div>
      </div>

      {/* Member info */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Member Information</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Full Name', value: fields.memberName || '—' },
            { label: 'Date of Birth', value: fields.dob || '—' },
            { label: 'Customer ID', value: fields.customerId || '—', mono: true },
            { label: 'Driver License', value: fields.dlNumber ? `${fields.licenseState} ···${fields.dlNumber.slice(-4)}` : '—' },
          ].map(({ label, value, mono }, i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}

          {/* Phone — editable */}
          <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
            {editPhone ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="tel" value={phoneVal} onChange={e => setPhoneVal(e.target.value)}
                  style={{ flex: 1, fontSize: 13, padding: '6px 10px', border: '1.5px solid #ff6221', borderRadius: 7, outline: 'none', background: 'var(--input)', color: 'var(--foreground)' }} autoFocus />
                <button onClick={savePhone} style={{ fontSize: 12, fontWeight: 700, color: 'white', background: '#ff6221', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}>Save</button>
                <button onClick={() => { setPhoneVal(fields.phone); setEditPhone(false); }} style={{ fontSize: 12, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Phone</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{fields.phone || '—'}</span>
                  <button onClick={() => setEditPhone(true)} style={{ color: '#ff6221', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><EditIcon /></button>
                </div>
              </div>
            )}
          </div>

          {/* Email — editable */}
          <div style={{ padding: '11px 16px' }}>
            {editEmail ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)}
                  style={{ flex: 1, fontSize: 13, padding: '6px 10px', border: '1.5px solid #ff6221', borderRadius: 7, outline: 'none', background: 'var(--input)', color: 'var(--foreground)' }} autoFocus />
                <button onClick={saveEmail} style={{ fontSize: 12, fontWeight: 700, color: 'white', background: '#ff6221', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}>Save</button>
                <button onClick={() => { setEmailVal(fields.email); setEditEmail(false); }} style={{ fontSize: 12, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Email</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fields.email || '—'}</span>
                  <button onClick={() => setEditEmail(true)} style={{ color: '#ff6221', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><EditIcon /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Market info */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Your Market Location</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 10 }}>Whip {market.name}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <span style={{ color: 'var(--muted-foreground)', marginTop: 1 }}><MapPinIcon /></span>
            <div>
              <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{market.address}</div>
              <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{market.city}, {market.state} {market.zip}</div>
            </div>
          </div>
          <a href={`tel:${market.phone.replace(/\D/g, '')}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ color: '#ff6221' }}><PhoneIcon /></span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ff6221' }}>{market.phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PORTAL ───────────────────────────────────────────────────────────────
type PortalTab = 'dashboard' | 'vehicles' | 'trips' | 'invoices' | 'support' | 'profile';

export default function MemberPortal({ fields, onPrint, onPrintAddon, addons, pipElection }: PortalProps) {
  const [tab, setTab] = useState<PortalTab>('dashboard');
  const [localFields, setLocalFields] = useState(fields);
  const market = getMarketForState(localFields.agreementState);

  const handleUpdateField = (k: 'phone' | 'email', v: string) => {
    setLocalFields(f => ({ ...f, [k]: v }));
  };

  const tabs: { id: PortalTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home',     icon: <DashIcon /> },
    { id: 'vehicles',  label: 'Vehicle',  icon: <CarIcon /> },
    { id: 'trips',     label: 'Trips',    icon: <HistoryIcon /> },
    { id: 'invoices',  label: 'Invoices', icon: <InvoiceIcon /> },
    { id: 'support',   label: 'Support',  icon: <SupportIcon /> },
    { id: 'profile',   label: 'Profile',  icon: <ProfileIcon /> },
  ];

  const TAB_LABELS: Record<PortalTab, string> = {
    dashboard: 'Dashboard', vehicles: 'Vehicle', trips: 'Trip History',
    invoices: 'Invoices', support: 'Support', profile: 'Profile',
  };

  const LOGO_URL = '/manus-storage/whip_logo_db5e4f39.png';

  return (
    <div className="app-shell">
      {/* TOP BAR */}
      <header className="top-bar">
        <img src={LOGO_URL} alt="Whip" className="top-bar-logo"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="top-bar-right">
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)' }}>
            {TAB_LABELS[tab]}
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="page-content" style={{ paddingBottom: 80 }}>
        {tab === 'dashboard' && (
          <DashboardPage fields={localFields} addons={addons} onPrint={onPrint} onPrintAddon={onPrintAddon} />
        )}
        {tab === 'vehicles' && (
          <VehiclesPage fields={localFields} addons={addons} pipElection={pipElection} />
        )}
        {tab === 'trips' && (
          <TripHistoryPage fields={localFields} />
        )}
        {tab === 'invoices' && (
          <InvoicingPage fields={localFields} />
        )}
        {tab === 'support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 4px' }}>Support</h2>
            <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: 0 }}>We're here to help.</p>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Help Desk Text Line</div>
              <a href={`sms:${HELP_DESK_TEXT_LINE.replace(/\D/g, '')}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fff7f4', border: '1px solid #ffe4d9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ff6221' }}>
                  <SupportIcon />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#ff6221' }}>{HELP_DESK_TEXT_LINE}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Text us anytime · Mon–Sun</div>
                </div>
              </a>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Your Local Office</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>Whip {market.name}</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span style={{ color: 'var(--muted-foreground)', marginTop: 1 }}><MapPinIcon /></span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{market.address}</div>
                  <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{market.city}, {market.state} {market.zip}</div>
                </div>
              </div>
              <a href={`tel:${market.phone.replace(/\D/g, '')}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <span style={{ color: '#ff6221' }}><PhoneIcon /></span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ff6221' }}>{market.phone}</span>
              </a>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>File a Claim</div>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 12px', lineHeight: 1.5 }}>
                Report accidents, theft, or vehicle damage within 24 hours.
              </p>
              <a href="https://drivewhip.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#ff6221', color: 'white', textDecoration: 'none', borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 700 }}>
                Go to drivewhip.com → File a Claim
              </a>
            </div>
          </div>
        )}
        {tab === 'profile' && (
          <ProfilePage fields={localFields} onUpdateField={handleUpdateField} />
        )}
      </main>

      {/* BOTTOM TAB BAR — 6 tabs, smaller text */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--card)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '6px 0', paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
        zIndex: 90, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}>
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer',
              color: tab === id ? '#ff6221' : 'var(--muted-foreground)',
              fontSize: 9, fontWeight: tab === id ? 700 : 400,
              minWidth: 0, flex: 1,
            }}
          >
            <span style={{ color: tab === id ? '#ff6221' : 'var(--muted-foreground)' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
