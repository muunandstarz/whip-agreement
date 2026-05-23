// ── WHIP MEMBER AGREEMENT APP ────────────────────────────────────────────────
// UI Design: Progressive/Enterprise app feel
// System font, white cards, navy header, orange CTAs, large form fields
// Print layer is completely isolated — PIP/GA/FL/PA forms unchanged

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import {
  STATE_DATA, STATE_OPTIONS, TOS_TEXT, ACK_ITEMS,
  URL_PARAM_MAP, type StateData, getMarketForState
} from '@/lib/agreementData';
import { buildPrintHTML, buildAddonOnlyHTML } from '@/lib/printBuilder';
import MemberPortal from './MemberPortal';

// ── ICONS (inline SVG — no extra deps) ──────────────────────────────────────
const ChevronRight = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M9 18l6-6-6-6"/></svg>
);
const ChevronLeft = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M15 18l-6-6 6-6"/></svg>
);
const ChevronDown = ({ size = 16, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M6 9l6 6 6-6"/></svg>
);
const Check = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
);
const CheckCircle = ({ size = 20, color = '#16a34a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 15.01 9 12.01"/></svg>
);
const FileText = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);
const Printer = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
);
const Sun = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
);
const Moon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
);
const RotateCcw = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
);
const Info = ({ size = 16, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
const Lock = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

// ── TYPES ────────────────────────────────────────────────────────────────────
interface MemberFields {
  memberName: string; dob: string; phone: string; email: string;
  dlNumber: string; licenseState: string; address: string; cityStateZip: string;
  customerId: string; reservationId: string; vehicle: string; vin: string;
  weeklyFee: string; deposit: string; startDate: string; endDate: string;
  agreementState: string; printedName: string; dateSigned: string;
}
type PipElection = 'full' | 'waive' | null;

const STEPS = [
  { id: 'welcome',   label: 'Start' },
  { id: 'info',      label: 'Your Info' },
  { id: 'tos',       label: 'Terms' },
  { id: 'agreement', label: 'Agreement' },
  { id: 'sign',      label: 'Sign' },
  { id: 'addons',    label: 'State Forms' },
  { id: 'complete',  label: 'Complete' },
];

const LOGO_URL = '/manus-storage/whip_logo_db5e4f39.png';

// ── SECTION DATA ─────────────────────────────────────────────────────────────
const AGREEMENT_SECTIONS = [
  {
    id: 'protection',
    title: 'Physical Damage Protection',
    badge: 'Covered',
    badgeType: 'covered',
    body: `Your weekly lease payment includes the Protection Plan. Metrocars Leasing Corp. maintains physical damage coverage (comprehensive and collision) on the vehicle as the registered owner.`,
    hint: {
      label: 'Your Responsibility',
      text: 'You are responsible for a Damage Fee of the lesser of actual repair cost or $1,000 per occurrence. Example: If repairs cost $750, your fee is $750. If repairs cost $3,200, your fee is $1,000.',
    },
    subItems: [
      { q: "What's Covered?", a: "Physical damage to the vehicle — comprehensive (theft, weather, vandalism) and collision." },
      { q: "What's Not Covered?", a: "Intentional damage, unauthorized driver operation, personal property, or violations of this Agreement." },
    ],
  },
  {
    id: 'liability',
    title: 'Liability Benefit',
    badge: 'State Minimum',
    badgeType: 'required',
    body: `Whip's liability benefit applies at the statutory minimum limits required by your state when your rideshare app is off (Period 0). It does not apply while you are active on a TNC platform.`,
    hint: {
      label: 'TNC Periods Explained',
      text: 'Period 0: App off — Whip liability applies. Period 1: App on, no ride — TNC platform coverage applies. Periods 2/3: Ride accepted/in progress — TNC platform coverage applies.',
    },
    subItems: [],
  },
  {
    id: 'operators',
    title: 'Authorized Operators',
    badge: 'Required',
    badgeType: 'required',
    body: `Only you — the Member identified in this Agreement — may operate the vehicle. Operation by any unauthorized person is a material breach and may result in immediate vehicle recovery without notice.`,
    hint: null,
    subItems: [],
  },
  {
    id: 'accident',
    title: 'Accident Reporting',
    badge: 'Required',
    badgeType: 'required',
    body: `You must report any accident, collision, theft, or vehicle damage to Whip within 24 hours of the incident. To file a claim, visit drivewhip.com and click "File a Claim".`,
    hint: {
      label: 'How to Report',
      text: 'Call: 855-861-9401\nTo file a claim online: go to drivewhip.com and click "File a Claim"\nFailure to report within 24 hours may result in you bearing full financial responsibility.',
      link: { text: 'File a Claim at drivewhip.com', url: 'https://drivewhip.com' },
    },
    subItems: [],
  },
  {
    id: 'dispute',
    title: 'Dispute Resolution',
    badge: 'Binding Arbitration',
    badgeType: 'required',
    body: `All disputes arising out of or relating to this Agreement shall be resolved by binding arbitration on an individual basis. You waive your right to a jury trial and to participate in any class action.`,
    hint: {
      label: 'What This Means',
      text: 'Instead of going to court, disputes are resolved by a neutral arbitrator. This is faster and less expensive than litigation. You cannot join a class action lawsuit against Whip.',
    },
    subItems: [],
  },
];

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AgreementPage() {
  const { theme, toggleTheme } = useTheme();

  const [prefilled, setPrefilled] = useState<Set<string>>(new Set());
  const [fields, setFields] = useState<MemberFields>({
    memberName: '', dob: '', phone: '', email: '',
    dlNumber: '', licenseState: '', address: '', cityStateZip: '',
    customerId: '', reservationId: '', vehicle: '', vin: '',
    weeklyFee: '', deposit: '', startDate: '', endDate: '',
    agreementState: '', printedName: '', dateSigned: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = { ...fields };
    const pf = new Set<string>();
    // Helper: convert MM/DD/YYYY or M/D/YYYY to YYYY-MM-DD for date inputs
    const toISODate = (v: string) => {
      const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
      return v;
    };
    const DATE_FIELDS = new Set(['startDate','endDate','dob']);
    params.forEach((val, key) => {
      const mapped = URL_PARAM_MAP[key];
      if (mapped && val) {
        const coerced = DATE_FIELDS.has(mapped) ? toISODate(val) : val;
        (next as Record<string, string>)[mapped] = coerced;
        pf.add(mapped);
      }
    });
    setFields(next);
    setPrefilled(pf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [stepIdx, setStepIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const [tosRead, setTosRead] = useState(false);
  const [tosAgreed, setTosAgreed] = useState(false);
  const tosRef = useRef<HTMLDivElement | null>(null);

  const [acksChecked, setAcksChecked] = useState<boolean[]>(Array(ACK_ITEMS.length).fill(false));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['protection']));
  const [expandedSubItems, setExpandedSubItems] = useState<Set<string>>(new Set());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [sigDataURL, setSigDataURL] = useState<string | null>(null);

  const [pipElection, setPipElection] = useState<PipElection>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [showDoneScreen, setShowDoneScreen] = useState(true); // shown first when step=complete

  const sendEmailMutation = trpc.agreement.sendEmail.useMutation({
    onSuccess: (data) => {
      if (data.sent) {
        setEmailSent(true);
        toast.success('Agreement emailed successfully');
      }
    },
    onError: () => {
      // Silent failure — email is best-effort
      console.warn('[Email] Failed to send agreement email');
    },
  });

  const stateData: StateData = STATE_DATA[fields.agreementState] || STATE_DATA['OTHER'];
  const hasAddons = stateData.addons.length > 0;
  const effectiveSteps = STEPS.filter(s => s.id !== 'addons' || hasAddons);
  const currentStep = effectiveSteps[stepIdx];

  const goTo = useCallback((idx: number) => {
    setAnimKey(k => k + 1);
    setStepIdx(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => {
    const nextIdx = stepIdx + 1;
    if (nextIdx < effectiveSteps.length) {
      const nextStep = effectiveSteps[nextIdx];
      // Fire email when advancing to the complete step
      if (nextStep?.id === 'complete' && !emailSent) {
        const agreementHtml = buildPrintHTML(fields, stateData, sigDataURL, pipElection);
        const addonHtmls = stateData.addons.map(key => ({
          label: key === 'md-pip' ? 'Maryland_PIP_Waiver' : key === 'ga-um' ? 'Georgia_UM_Rejection' : key === 'fl-um' ? 'Florida_UM_Rejection' : 'PA_Coverage_Election',
          html: buildAddonOnlyHTML(key, fields, stateData, sigDataURL, pipElection),
        }));
        sendEmailMutation.mutate({
          memberName: fields.memberName || 'Member',
          memberEmail: fields.email || undefined,
          agreementHtml,
          addonHtmls: addonHtmls.length > 0 ? addonHtmls : undefined,
        });
      }
      goTo(nextIdx);
    }
  }, [stepIdx, effectiveSteps, goTo, emailSent, fields, stateData, sigDataURL, pipElection, sendEmailMutation]);

  const goBack = useCallback(() => {
    if (stepIdx > 0) goTo(stepIdx - 1);
  }, [stepIdx, goTo]);

  const setField = (key: keyof MemberFields, val: string) =>
    setFields(f => ({ ...f, [key]: val }));

  const handleTosScroll = () => {
    const el = tosRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setTosRead(true);
  };

  // Canvas drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const c = canvasRef.current; if (!c) return;
    setIsSigning(true);
    lastPoint.current = getPos(e, c);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isSigning) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, c);
    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = theme === 'dark' ? '#e2e8f0' : '#171b31';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    lastPoint.current = pos;
    setHasSig(true);
  };
  const endDraw = () => {
    setIsSigning(false);
    lastPoint.current = null;
    if (hasSig && canvasRef.current) setSigDataURL(canvasRef.current.toDataURL('image/png'));
  };
  const clearSig = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    setHasSig(false);
    setSigDataURL(null);
  };

  const handlePrint = () => {
    const html = buildPrintHTML(fields, stateData, sigDataURL, pipElection);
    let el = document.getElementById('print-output');
    if (el) el.remove();
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const newEl = wrap.querySelector('#print-output') as HTMLElement;
    if (newEl) { newEl.style.display = 'none'; document.body.appendChild(newEl); }
    window.print();
  };

  const handlePrintAddon = (addonKey: string) => {
    const html = buildAddonOnlyHTML(addonKey, fields, stateData, sigDataURL, pipElection);
    let el = document.getElementById('print-output');
    if (el) el.remove();
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const newEl = wrap.querySelector('#print-output') as HTMLElement;
    if (newEl) { newEl.style.display = 'none'; document.body.appendChild(newEl); }
    window.print();
  };

  const canProceed = () => {
    switch (currentStep?.id) {
      case 'welcome': return true;
      case 'info': return !!(fields.memberName && fields.dob && fields.dlNumber && fields.licenseState && fields.email && fields.phone && fields.address && fields.cityStateZip && fields.customerId && fields.reservationId && fields.vehicle && fields.vin && fields.weeklyFee && fields.deposit && fields.startDate && fields.endDate && fields.agreementState);
      case 'tos': return tosRead && tosAgreed;
      case 'agreement': return acksChecked.every(Boolean);
      case 'sign': return hasSig && !!fields.printedName;
      case 'addons': return stateData.addons.includes('md-pip') ? pipElection !== null : true;
      default: return true;
    }
  };

  const progressPct = effectiveSteps.length > 1
    ? (stepIdx / (effectiveSteps.length - 1)) * 100 : 0;

  const isFirstStep = stepIdx === 0;
  const isLastStep = stepIdx === effectiveSteps.length - 1;

  return (
    <div className="app-shell">
      {/* TOP BAR */}
      <header className="top-bar">
        <img src={LOGO_URL} alt="Whip" className="top-bar-logo"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="top-bar-right">
          {!isFirstStep && !isLastStep && (
            <span className="top-bar-step">{stepIdx} of {effectiveSteps.length - 1}</span>
          )}
          <button className="top-bar-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* STEP TABS */}
      {!isFirstStep && !isLastStep && (
        <nav className="step-tabs">
          <div className="step-tabs-inner">
            {effectiveSteps.filter(s => s.id !== 'welcome' && s.id !== 'complete').map((step, i) => {
              const realIdx = effectiveSteps.findIndex(s => s.id === step.id);
              const isActive = realIdx === stepIdx;
              const isDone = realIdx < stepIdx;
              return (
                <button
                  key={step.id}
                  className={`step-tab ${isActive ? 'active' : isDone ? 'done' : 'locked'}`}
                  onClick={() => isDone ? goTo(realIdx) : undefined}
                  disabled={!isDone && !isActive}
                >
                  {isDone && <CheckCircle size={12} color="#16a34a" />}
                  {step.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* MAIN CONTENT */}
      <main className="page-content">
        <div key={animKey} className="step-enter">
          {currentStep?.id === 'welcome' && (
            <WelcomeStep fields={fields} prefilled={prefilled} onNext={goNext} setField={setField} />
          )}
          {currentStep?.id === 'info' && (
            <InfoStep fields={fields} prefilled={prefilled} setField={setField} />
          )}
          {currentStep?.id === 'tos' && (
            <TosStep
              tosRef={tosRef} tosRead={tosRead} tosAgreed={tosAgreed}
              setTosAgreed={setTosAgreed} onScroll={handleTosScroll}
            />
          )}
          {currentStep?.id === 'agreement' && (
            <AgreementStep
              fields={fields} stateData={stateData}
              acksChecked={acksChecked} setAcksChecked={setAcksChecked}
              expandedSections={expandedSections} setExpandedSections={setExpandedSections}
              expandedSubItems={expandedSubItems} setExpandedSubItems={setExpandedSubItems}
            />
          )}
          {currentStep?.id === 'sign' && (
            <SignStep
              fields={fields} setField={setField}
              canvasRef={canvasRef} hasSig={hasSig}
              startDraw={startDraw} draw={draw} endDraw={endDraw} clearSig={clearSig}
            />
          )}
          {currentStep?.id === 'addons' && (
            <AddonsStep stateData={stateData} pipElection={pipElection} setPipElection={setPipElection} />
          )}
          {currentStep?.id === 'complete' && showDoneScreen && (
            <DoneScreen
              fields={fields}
              stateData={stateData}
              onEnterPortal={() => setShowDoneScreen(false)}
              onPrint={handlePrint}
              onPrintAddon={handlePrintAddon}
            />
          )}
          {currentStep?.id === 'complete' && !showDoneScreen && (
            <MemberPortal
              fields={fields}
              onPrint={handlePrint}
              onPrintAddon={handlePrintAddon}
              addons={stateData.addons}
              pipElection={pipElection}
            />
          )}
        </div>
      </main>

      {/* BOTTOM NAV */}
      {!isFirstStep && !isLastStep && (
        <div className="bottom-nav">
          <div className="bottom-nav-inner">
            <button className="btn-primary" onClick={goNext} disabled={!canProceed()}>
              {currentStep?.id === 'sign' ? 'Sign & Continue' : 'Continue'}
              <ChevronRight size={18} />
            </button>
            <button className="btn-back" onClick={goBack}>
              <ChevronLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── WELCOME ──────────────────────────────────────────────────────────────────
function WelcomeStep({ fields, prefilled, onNext, setField }: {
  fields: MemberFields; prefilled: Set<string>; onNext: () => void;
  setField: (k: keyof MemberFields, v: string) => void;
}) {
  const hasPrefill = prefilled.size > 0;
  const firstName = fields.memberName ? fields.memberName.split(' ')[0] : null;
  const market = getMarketForState(fields.agreementState);

  const WELCOME_STEPS = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'info',    label: 'Info' },
    { id: 'tos',     label: 'Terms' },
    { id: 'docs',    label: 'Documents' },
    { id: 'review',  label: 'Review' },
    { id: 'sign',    label: 'Sign' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Step pill row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
        {WELCOME_STEPS.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i === 0 ? '#ff6221' : 'var(--muted)',
                border: i === 0 ? 'none' : '1.5px solid var(--border)',
                color: i === 0 ? 'white' : 'var(--muted-foreground)',
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{i + 1}</div>
              <span style={{ fontSize: 10, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#ff6221' : 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < WELCOME_STEPS.length - 1 && (
              <div style={{ width: 20, height: 1.5, background: 'var(--border)', margin: '0 2px', marginBottom: 16, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Hero image + title card */}
      <div className="screen-card" style={{ overflow: 'hidden', marginBottom: 16 }}>
        {/* Car image hero */}
        <div style={{ position: 'relative', height: 160, overflow: 'hidden', background: '#171b31' }}>
          <img
            src="https://www.drivewhip.com/wp-content/uploads/2023/06/ModelY.jpg"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
          />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, #171b31 100%)' }} />
          {/* Floating icon */}
          <div style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', width: 48, height: 48, borderRadius: '50%', background: '#171b31', border: '3px solid var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6221" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
        </div>

        <div style={{ padding: '32px 20px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Member Lease Agreement
          </h1>
          <div style={{ width: 36, height: 3, background: '#ff6221', borderRadius: 2, margin: '10px auto 14px' }} />
          <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: '0 0 16px', lineHeight: 1.55 }}>
            {hasPrefill
              ? `${firstName ? `Hi ${firstName} — your` : 'Your'} information has been pre-filled. Review and sign to complete.`
              : "Let's get your membership agreement set up. It only takes about 5 minutes."}
          </p>

          {/* Security badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--muted)', borderRadius: 10, marginBottom: 20, textAlign: 'left' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6221" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            <span style={{ fontSize: 13, color: 'var(--foreground)', fontWeight: 500, lineHeight: 1.4 }}>Your information is secure and encrypted. This is a binding legal agreement.</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 'auto' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>

          {/* Trust trio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6221" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: 'Secure & Private', desc: 'Encrypted session' },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6221" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: '5 Minute Process', desc: 'Quick & easy' },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6221" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: 'Legally Binding', desc: 'For your protection' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground)', textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted-foreground)', textAlign: 'center', lineHeight: 1.3 }}>{desc}</div>
              </div>
            ))}
          </div>

          {hasPrefill && (
            <div className="prefill-banner" style={{ marginBottom: 16, textAlign: 'left' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Some fields have been pre-filled from your reservation. You can update any field before signing.</span>
            </div>
          )}

          {/* State selector */}
          <div className="field-group" style={{ textAlign: 'left' }}>
            <label className="field-label">Select Your Garaging State <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              className={`field-input field-input-select ${prefilled.has('agreementState') ? 'prefilled' : ''}`}
              value={fields.agreementState}
              onChange={e => setField('agreementState', e.target.value)}
            >
              <option value="">Select state…</option>
              {STATE_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
              This determines which state-specific forms are required.
            </p>
          </div>

          <button className="btn-primary" onClick={onNext} disabled={!fields.agreementState} style={{ marginTop: 8 }}>
            Get Started <ChevronRight size={18} />
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)', marginTop: 10 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Backed by Whip Protection Plan
          </p>
        </div>
      </div>

      {/* Help link */}
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>
        Need help? <a href={`tel:${market.phone.replace(/\D/g, '')}`} style={{ color: '#ff6221', fontWeight: 600 }}>Contact Support</a>
      </p>
    </div>
  );
}

// ── INFO ─────────────────────────────────────────────────────────────────────
function InfoStep({ fields, prefilled, setField }: {
  fields: MemberFields; prefilled: Set<string>;
  setField: (k: keyof MemberFields, v: string) => void;
}) {
  const pf = (k: string) => prefilled.has(k) ? 'prefilled' : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <h2 className="page-title">Personal Information</h2>
      <p className="page-subtitle">Please enter your details below.</p>

      <div className="screen-card">
        <div className="screen-card-body" style={{ paddingTop: 20 }}>
          <FI label="Full Legal Name *" className={pf('memberName')}>
            <input className={`field-input ${pf('memberName')}`} value={fields.memberName}
              onChange={e => setField('memberName', e.target.value)} placeholder="John D. Smith"
              readOnly={prefilled.has('memberName')} />
          </FI>
          <FI label="Date of Birth *" className={pf('dob')}>
            <input type="date" className={`field-input ${pf('dob')}`} value={fields.dob}
              onChange={e => setField('dob', e.target.value)}
              readOnly={prefilled.has('dob')} />
          </FI>
          <FI label="Driver's License Number *">
            <input className="field-input" value={fields.dlNumber}
              onChange={e => setField('dlNumber', e.target.value)} placeholder="S123-456-789-012"
              style={{ fontFamily: 'monospace' }} />
          </FI>
          <FI label="State of License *">
            <select className="field-input field-input-select"
              value={fields.licenseState} onChange={e => setField('licenseState', e.target.value)}>
              <option value="">Select…</option>
              {STATE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </FI>
          <FI label="Email Address *">
            <input type="email" className="field-input" value={fields.email}
              onChange={e => setField('email', e.target.value)} placeholder="john.smith@gmail.com" />
          </FI>
          <FI label="Phone Number *">
            <input type="tel" className="field-input" value={fields.phone}
              onChange={e => setField('phone', e.target.value)} placeholder="(404) 555-0123" />
          </FI>
          <FI label="Street Address *" className={pf('address')}>
            <input className={`field-input ${pf('address')}`} value={fields.address}
              onChange={e => setField('address', e.target.value)} placeholder="123 Main Street"
              readOnly={prefilled.has('address')} />
          </FI>
          <FI label="City, State, ZIP *" className={pf('cityStateZip')}>
            <input className={`field-input ${pf('cityStateZip')}`} value={fields.cityStateZip}
              onChange={e => setField('cityStateZip', e.target.value)} placeholder="Atlanta, GA 30301"
              readOnly={prefilled.has('cityStateZip')} />
          </FI>
        </div>
      </div>

      <div style={{ height: 20 }} />

      <h2 className="page-title">Reservation Details</h2>
      <p className="page-subtitle" style={{ marginBottom: 0 }}>Pre-filled from your reservation.</p>

      <div className="screen-card" style={{ marginTop: 16 }}>
        <div className="screen-card-body" style={{ paddingTop: 20 }}>
          <FI label="Member / Customer ID *" className={pf('customerId')}>
            <input className={`field-input ${pf('customerId')}`} value={fields.customerId}
              onChange={e => setField('customerId', e.target.value)}
              readOnly={prefilled.has('customerId')} style={{ fontFamily: 'monospace' }} />
          </FI>
          <FI label="Reservation ID *" className={pf('reservationId')}>
            <input className={`field-input ${pf('reservationId')}`} value={fields.reservationId}
              onChange={e => setField('reservationId', e.target.value)}
              readOnly={prefilled.has('reservationId')} style={{ fontFamily: 'monospace' }} />
          </FI>
          <FI label="Vehicle (Year Make Model) *" className={pf('vehicle')}>
            <input className={`field-input ${pf('vehicle')}`} value={fields.vehicle}
              onChange={e => setField('vehicle', e.target.value)} placeholder="2022 Toyota Camry"
              readOnly={prefilled.has('vehicle')} />
          </FI>
          <FI label="VIN *" className={pf('vin')}>
            <input className={`field-input ${pf('vin')}`} value={fields.vin}
              onChange={e => setField('vin', e.target.value.toUpperCase())} placeholder="17-character VIN"
              maxLength={17} readOnly={prefilled.has('vin')}
              style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </FI>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FI label="Weekly Fee ($) *" className={pf('weeklyFee')}>
              <input type="number" className={`field-input ${pf('weeklyFee')}`} value={fields.weeklyFee}
                onChange={e => setField('weeklyFee', e.target.value)} placeholder="0.00"
                readOnly={prefilled.has('weeklyFee')} />
            </FI>
            <FI label="Deposit ($) *" className={pf('deposit')}>
              <input type="number" className={`field-input ${pf('deposit')}`} value={fields.deposit}
                onChange={e => setField('deposit', e.target.value)} placeholder="0.00"
                readOnly={prefilled.has('deposit')} />
            </FI>
            <FI label="Start Date *" className={pf('startDate')}>
              <input type="date" className={`field-input ${pf('startDate')}`} value={fields.startDate}
                onChange={e => setField('startDate', e.target.value)}
                readOnly={prefilled.has('startDate')} />
            </FI>
            <FI label="End Date *" className={pf('endDate')}>
              <input type="date" className={`field-input ${pf('endDate')}`} value={fields.endDate}
                onChange={e => setField('endDate', e.target.value)}
                readOnly={prefilled.has('endDate')} />
            </FI>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TOS ──────────────────────────────────────────────────────────────────────
function TosStep({ tosRef, tosRead, tosAgreed, setTosAgreed, onScroll }: {
  tosRef: React.RefObject<HTMLDivElement | null>; tosRead: boolean; tosAgreed: boolean;
  setTosAgreed: (v: boolean) => void; onScroll: () => void;
}) {
  return (
    <div>
      <h2 className="page-title">Terms of Service</h2>
      <p className="page-subtitle">Please read the full Terms of Service. Scroll to the bottom to continue.</p>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        {!tosRead && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#fef3c7', border: '1px solid #fcd34d',
            color: '#92400e', fontSize: 11, fontWeight: 600,
            padding: '4px 10px', borderRadius: 20
          }}>
            <Lock size={11} /> Scroll to unlock
          </div>
        )}
        {tosRead && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#dcfce7', border: '1px solid #86efac',
            color: '#15803d', fontSize: 11, fontWeight: 600,
            padding: '4px 10px', borderRadius: 20
          }}>
            <CheckCircle size={12} color="#15803d" /> Read
          </div>
        )}
        <div ref={tosRef} className="tos-scroll-area" onScroll={onScroll}>
          {TOS_TEXT.split('\n').map((line, i) =>
            line.trim() === '' ? <br key={i} /> : <p key={i} style={{ margin: '0 0 6px' }}>{line}</p>
          )}
        </div>
      </div>

      <div
        onClick={() => tosRead && setTosAgreed(!tosAgreed)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '16px', borderRadius: 10,
          border: `2px solid ${tosAgreed ? '#16a34a' : tosRead ? 'var(--border)' : 'var(--border)'}`,
          background: tosAgreed ? '#f0fdf4' : 'var(--card)',
          cursor: tosRead ? 'pointer' : 'not-allowed',
          opacity: tosRead ? 1 : 0.5,
          transition: 'all 0.15s',
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
          border: `2px solid ${tosAgreed ? '#16a34a' : 'var(--border)'}`,
          background: tosAgreed ? '#16a34a' : 'var(--input)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {tosAgreed && <Check size={13} />}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 2 }}>
            I have read and agree to the Terms of Service
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.45 }}>
            I understand these terms are legally binding and govern my use of Whip services.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AGREEMENT ────────────────────────────────────────────────────────────────
function AgreementStep({ fields, stateData, acksChecked, setAcksChecked, expandedSections, setExpandedSections, expandedSubItems, setExpandedSubItems }: {
  fields: MemberFields; stateData: StateData;
  acksChecked: boolean[]; setAcksChecked: (v: boolean[]) => void;
  expandedSections: Set<string>; setExpandedSections: (v: Set<string>) => void;
  expandedSubItems: Set<string>; setExpandedSubItems: (v: Set<string>) => void;
}) {
  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedSections(next);
  };
  const toggleSub = (id: string) => {
    const next = new Set(expandedSubItems);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedSubItems(next);
  };
  const toggleAck = (i: number) => {
    const next = [...acksChecked]; next[i] = !next[i]; setAcksChecked(next);
  };
  const allChecked = acksChecked.every(Boolean);

  return (
    <div>
      <h2 className="page-title">Agreement Sections</h2>
      <p className="page-subtitle">Review each section. Tap to expand for details and explanations.</p>

      {/* Section cards */}
      {AGREEMENT_SECTIONS.map(sec => {
        const isOpen = expandedSections.has(sec.id);
        // Override liability body with state-specific text
        const body = sec.id === 'liability' ? stateData.liabilityNote : sec.body;
        return (
          <div key={sec.id} className="section-card">
            <div className="section-card-header" onClick={() => toggleSection(sec.id)}>
              <span className="section-card-title">{sec.title}</span>
              <span className={`section-card-badge ${sec.badgeType === 'covered' ? 'badge-covered' : 'badge-required'}`}>
                {sec.badge}
              </span>
              <ChevronDown size={16} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--muted-foreground)' }} />
            </div>
            {isOpen && (
              <div className="section-card-body">
                <p>{body}</p>
                {sec.hint && (
                  <div className="hint-box">
                    <div className="hint-box-label">{sec.hint.label}</div>
                    <p style={{ whiteSpace: 'pre-line' }}>{sec.hint.text}</p>
                    {sec.hint.link && (
                      <a
                        href={sec.hint.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-block', marginTop: 8, fontSize: 13, fontWeight: 600, color: '#ff6221', textDecoration: 'underline' }}
                      >
                        {sec.hint.link.text} →
                      </a>
                    )}
                  </div>
                )}
                {sec.subItems.map(sub => {
                  const subId = `${sec.id}-${sub.q}`;
                  const subOpen = expandedSubItems.has(subId);
                  return (
                    <div key={sub.q} style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      <button
                        onClick={() => toggleSub(subId)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)' }}>{sub.q}</span>
                        <ChevronDown size={14} style={{ flexShrink: 0, transform: subOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                      {subOpen && <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 6, lineHeight: 1.5 }}>{sub.a}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {stateData.statDisclosure && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#92400e', marginBottom: 4 }}>
            {stateData.name} State Disclosure
          </div>
          <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.55, margin: 0 }}>{stateData.statDisclosure}</p>
        </div>
      )}

      {/* Acknowledgments */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Important Acknowledgments</h3>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500 }}>
            {acksChecked.filter(Boolean).length}/{ACK_ITEMS.length}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 12 }}>
          Please review and acknowledge the following terms.
        </p>
        <div className="screen-card">
          {ACK_ITEMS.map((item, i) => (
            <div key={i} className={`ack-item ${acksChecked[i] ? 'checked' : ''}`} onClick={() => toggleAck(i)}>
              <div className={`ack-checkbox ${acksChecked[i] ? 'checked' : ''}`}>
                {acksChecked[i] && <Check size={12} />}
              </div>
              <span className="ack-item-text">{item}</span>
            </div>
          ))}
        </div>
        {!allChecked && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)', marginTop: 10 }}>
            Check all {ACK_ITEMS.length} acknowledgments to continue.
          </p>
        )}
      </div>
    </div>
  );
}

// ── SIGN ─────────────────────────────────────────────────────────────────────
function SignStep({ fields, setField, canvasRef, hasSig, startDraw, draw, endDraw, clearSig }: {
  fields: MemberFields; setField: (k: keyof MemberFields, v: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>; hasSig: boolean;
  startDraw: (e: React.MouseEvent | React.TouchEvent) => void;
  draw: (e: React.MouseEvent | React.TouchEvent) => void;
  endDraw: () => void; clearSig: () => void;
}) {
  return (
    <div>
      <h2 className="page-title">Electronic Signature</h2>
      <p className="page-subtitle">Please review and sign your agreement.</p>

      <div className="screen-card">
        <div className="screen-card-body" style={{ paddingTop: 20 }}>
          {/* Sig tabs */}
          <div className="sig-tab-bar">
            <button className="sig-tab active">Draw Signature</button>
          </div>

          {/* Canvas */}
          <div style={{ position: 'relative', marginTop: 12 }}>
            <div className="sig-canvas-wrap">
              <canvas
                ref={canvasRef} width={560} height={150}
                style={{ width: '100%', height: 150, display: 'block' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
              />
            </div>
            {!hasSig && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 14, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Sign here</span>
              </div>
            )}
          </div>

          {hasSig && (
            <button onClick={clearSig} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--muted-foreground)', background: 'none', border: 'none', padding: '6px 0', marginTop: 4 }}>
              <RotateCcw size={13} /> Clear signature
            </button>
          )}

          <div style={{ height: 16 }} />

          <FI label="Type Your Full Name *">
            <input className="field-input" value={fields.printedName}
              onChange={e => setField('printedName', e.target.value)}
              placeholder="Type your full legal name" style={{ fontSize: 16 }} />
          </FI>

          <div style={{ background: 'var(--muted)', borderRadius: 8, padding: '12px 14px', marginTop: 4, fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.55 }}>
            By signing above and typing my name, I agree to the terms of this agreement and the{' '}
            <span style={{ color: '#ff6221', fontWeight: 600 }}>Terms of Service</span>.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ADDONS ───────────────────────────────────────────────────────────────────
function AddonsStep({ stateData, pipElection, setPipElection }: {
  stateData: StateData; pipElection: PipElection; setPipElection: (v: PipElection) => void;
}) {
  return (
    <div>
      <h2 className="page-title">{stateData.name} Required Forms</h2>
      <p className="page-subtitle">{stateData.name} law requires the following elections before your agreement is complete.</p>

      {stateData.addons.includes('md-pip') && (
        <div className="screen-card">
          <div className="screen-card-header">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>PIP Coverage Election</h3>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>Required by Maryland Law</p>
          </div>
          <div className="screen-card-body" style={{ paddingTop: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--foreground)', marginBottom: 16, lineHeight: 1.55 }}>
              Personal Injury Protection (PIP) pays medical expenses and lost wages regardless of fault. Select your coverage option:
            </p>
            <div
              className={`radio-option ${pipElection === 'full' ? 'selected' : ''}`}
              onClick={() => setPipElection('full')}
            >
              <div className="radio-dot">
                <div className="radio-dot-inner" />
              </div>
              <div>
                <div className="radio-option-label">Request Full PIP Coverage</div>
                <div className="radio-option-desc">$2,400/year — $50/week. Covers medical expenses and lost wages for you and passengers.</div>
              </div>
            </div>
            <div
              className={`radio-option ${pipElection === 'waive' ? 'selected' : ''}`}
              onClick={() => setPipElection('waive')}
            >
              <div className="radio-dot">
                <div className="radio-dot-inner" />
              </div>
              <div>
                <div className="radio-option-label">Waive PIP Coverage</div>
                <div className="radio-option-desc">I affirmatively waive PIP benefits. I understand I will have no PIP coverage.</div>
              </div>
            </div>
            {pipElection === 'waive' && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
                <strong>Notice:</strong> By waiving PIP, you and your passengers will have no PIP benefits. A signed waiver will be included in your printed agreement.
              </div>
            )}
          </div>
        </div>
      )}

      {stateData.addons.includes('ga-um') && (
        <div className="screen-card">
          <div className="screen-card-header">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>UM Coverage Selection</h3>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>Required by Georgia Law (O.C.G.A. § 33-7-11)</p>
          </div>
          <div className="screen-card-body" style={{ paddingTop: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--foreground)', marginBottom: 12, lineHeight: 1.55 }}>
              Per your lease terms, Uninsured Motorist (UM) coverage is being rejected for this vehicle. A signed rejection form will be included in your agreement.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
              <CheckCircle size={18} color="#16a34a" />
              <span style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>UM Rejection form will be included in your package</span>
            </div>
          </div>
        </div>
      )}

      {stateData.addons.includes('fl-um') && (
        <div className="screen-card">
          <div className="screen-card-header">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>UM/UIM Coverage Selection</h3>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>Required by Florida Law (§ 627.727)</p>
          </div>
          <div className="screen-card-body" style={{ paddingTop: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--foreground)', marginBottom: 12, lineHeight: 1.55 }}>
              Per your lease terms, Uninsured/Underinsured Motorist (UM/UIM) coverage is being rejected for this vehicle.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
              <CheckCircle size={18} color="#16a34a" />
              <span style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>UM/UIM Rejection form will be included in your package</span>
            </div>
          </div>
        </div>
      )}

      {stateData.addons.includes('pa-pip') && (
        <div className="screen-card">
          <div className="screen-card-header">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>First Party Benefits Election</h3>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>Required by Pennsylvania Law</p>
          </div>
          <div className="screen-card-body" style={{ paddingTop: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--foreground)', marginBottom: 12, lineHeight: 1.55 }}>
              Pennsylvania requires elections for First Party Medical Benefits and UM/UIM coverage. Both are being rejected per your lease terms.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
              <CheckCircle size={18} color="#16a34a" />
              <span style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>PA coverage election form will be included in your package</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── COMPLETE ─────────────────────────────────────────────────────────────────
function CompleteStep({ fields, stateData, onPrint, onPrintAddon }: {
  fields: MemberFields; stateData: StateData; onPrint: () => void; onPrintAddon: (addonKey: string) => void; onBack: () => void;
}) {
  const firstName = fields.memberName ? fields.memberName.split(' ')[0] : null;
  const signedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const docs: { label: string; sub: string; onView: () => void }[] = [
    { label: 'Member Agreement', sub: 'Signed ' + signedDate, onView: onPrint },
    ...(stateData.addons.includes('md-pip') ? [{ label: 'Maryland PIP Waiver', sub: 'Signed ' + signedDate, onView: () => onPrintAddon('md-pip') }] : []),
    ...(stateData.addons.includes('ga-um') ? [{ label: 'Georgia UM Rejection', sub: 'Signed ' + signedDate, onView: () => onPrintAddon('ga-um') }] : []),
    ...(stateData.addons.includes('fl-um') ? [{ label: 'Florida UM/UIM Rejection', sub: 'Signed ' + signedDate, onView: () => onPrintAddon('fl-um') }] : []),
    ...(stateData.addons.includes('pa-pip') ? [{ label: 'Pennsylvania Coverage Election', sub: 'Signed ' + signedDate, onView: () => onPrintAddon('pa-pip') }] : []),
  ];

  const bottomTabs = [
    { label: 'Dashboard', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { label: 'Vehicles', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
    { label: 'Support', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { label: 'Profile', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>
      {/* Success hero */}
      <div className="screen-card">
        <div style={{ background: '#171b31', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={36} color="#4ade80" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>You're All Set!</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
            {firstName
              ? `${firstName}, your agreement has been successfully completed and signed.`
              : 'Your agreement has been successfully completed and signed.'}
          </p>
        </div>
        <div className="screen-card-body" style={{ paddingTop: 20 }}>
          {[
            { label: 'Agreement PDF Generated' },
            { label: 'Saved to Your Profile' },
          ].map(({ label }) => (
            <div key={label} className="status-item">
              <CheckCircle size={20} color="#16a34a" />
              <span className="status-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 12 }}>My Documents</h3>
        <div className="screen-card">
          {docs.map(({ label, sub, onView }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < docs.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{sub}</div>
              </div>
              <button onClick={onView} style={{ fontSize: 13, color: '#ff6221', fontWeight: 700, background: 'none', border: 'none', padding: '4px 8px', flexShrink: 0 }}>View</button>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={onPrint}>
        <Printer size={18} /> Download Agreement PDF
      </button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)', marginTop: -8 }}>
        Use your browser's print dialog to save as PDF.
      </p>

      {/* Bottom tab bar (display-only) */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--card)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '8px 0', paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        zIndex: 90, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
      }}>
        {bottomTabs.map(({ label, icon }, i) => (
          <button
            key={label}
            onClick={() => toast(`${label} — coming soon`, { description: 'This feature will be available in the full Whip app.' })}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', padding: '4px 12px',
              color: i === 2 ? '#ff6221' : 'var(--muted-foreground)',
              fontSize: 10, fontWeight: i === 2 ? 700 : 400,
            }}
          >
            <span style={{ color: i === 2 ? '#ff6221' : 'var(--muted-foreground)' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── DONE SCREEN ─────────────────────────────────────────────────────────────
function DoneScreen({ fields, stateData, onEnterPortal, onPrint, onPrintAddon }: {
  fields: MemberFields; stateData: StateData; onEnterPortal: () => void;
  onPrint: () => void; onPrintAddon: (key: string) => void;
}) {
  const firstName = fields.memberName ? fields.memberName.split(' ')[0] : null;
  const signedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const docs: { label: string; key: string | null }[] = [
    { label: 'Member Agreement', key: null },
    ...(stateData.addons.includes('md-pip') ? [{ label: 'Maryland PIP Waiver', key: 'md-pip' }] : []),
    ...(stateData.addons.includes('ga-um') ? [{ label: 'Georgia UM Rejection', key: 'ga-um' }] : []),
    ...(stateData.addons.includes('fl-um') ? [{ label: 'Florida UM/UIM Rejection', key: 'fl-um' }] : []),
    ...(stateData.addons.includes('pa-pip') ? [{ label: 'Pennsylvania Coverage Election', key: 'pa-pip' }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 120 }}>
      {/* Success hero */}
      <div style={{ background: '#171b31', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '40px 24px 32px', textAlign: 'center' }}>
          {/* Animated checkmark */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(74,222,128,0.12)', border: '2.5px solid rgba(74,222,128,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'popIn 0.4s cubic-bezier(0.23,1,0.32,1) both',
          }}>
            <CheckCircle size={44} color="#4ade80" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {firstName ? `You're all set, ${firstName}!` : "You're all set!"}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.55 }}>
            Your agreement has been signed and your documents are ready.
          </p>
        </div>
        {/* Status checklist */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Agreement signed & timestamped',
            'Documents saved to your profile',
            'Coverage active per reservation terms',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '1.5px solid rgba(74,222,128,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signed documents */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Signed Documents</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {docs.map((doc, i) => (
            <div key={doc.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < docs.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,98,33,0.08)', border: '1px solid rgba(255,98,33,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ff6221' }}>
                <FileText size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{doc.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Signed {signedDate}</div>
              </div>
              <button
                onClick={() => doc.key ? onPrintAddon(doc.key) : onPrint()}
                style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,98,33,0.08)', border: '1px solid rgba(255,98,33,0.2)', color: '#ff6221', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                PDF
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create account prompt */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 18px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6 }}>Create your Whip account</div>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 14px', lineHeight: 1.5 }}>
          Set up a password to access your member portal anytime — view documents, track trips, and manage your profile.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email"
            placeholder="Email address"
            defaultValue={fields.email || ''}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 14, boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Create a password"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 14, boxSizing: 'border-box' }}
          />
          <button
            onClick={() => toast('Account creation coming soon', { description: 'This will be available in the full Whip app.' })}
            style={{ width: '100%', padding: '12px', borderRadius: 8, background: '#ff6221', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Enter portal CTA */}
      <button
        onClick={onEnterPortal}
        style={{
          width: '100%', padding: '14px', borderRadius: 10,
          background: '#171b31', color: 'white',
          fontWeight: 700, fontSize: 15, border: '1.5px solid rgba(255,255,255,0.12)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Go to My Portal
      </button>
    </div>
  );
}

// ── FIELD HELPER ─────────────────────────────────────────────────────────────
function FI({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`field-group ${className || ''}`}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
