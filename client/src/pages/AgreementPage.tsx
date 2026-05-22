// ── WHIP MEMBER AGREEMENT APP ────────────────────────────────────────────────
// Design: Precision Legal — white canvas, navy (#171b31) authority, orange (#ff6221) action
// URL params pre-fill member data from Drive+/Smartsheets
// Steps: Welcome → Info → TOS → Agreement → Sign → Addons (state-specific) → Complete

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  STATE_DATA, STATE_OPTIONS, TOS_TEXT, ACK_ITEMS,
  URL_PARAM_MAP, type StateData
} from '@/lib/agreementData';
import { buildPrintHTML } from '@/lib/printBuilder';
import {
  ChevronRight, ChevronLeft, FileText, PenLine, CheckCircle2,
  Lock, Unlock, Moon, Sun, Printer, RotateCcw, Info, Shield,
  AlertCircle
} from 'lucide-react';

// ── TYPES ────────────────────────────────────────────────────────────────────
interface MemberFields {
  memberName: string;
  dob: string;
  phone: string;
  email: string;
  dlNumber: string;
  licenseState: string;
  address: string;
  cityStateZip: string;
  customerId: string;
  reservationId: string;
  vehicle: string;
  vin: string;
  weeklyFee: string;
  deposit: string;
  startDate: string;
  endDate: string;
  agreementState: string;
  printedName: string;
  dateSigned: string;
}

type PipElection = 'full' | 'waive' | null;

const STEPS = [
  { id: 'welcome',   label: 'Welcome',    icon: FileText },
  { id: 'info',      label: 'Your Info',  icon: Info },
  { id: 'tos',       label: 'Terms',      icon: Shield },
  { id: 'agreement', label: 'Agreement',  icon: FileText },
  { id: 'sign',      label: 'Sign',       icon: PenLine },
  { id: 'addons',    label: 'Addons',     icon: AlertCircle },
  { id: 'complete',  label: 'Complete',   icon: CheckCircle2 },
];

const LOGO_URL = '/manus-storage/whip_logo_db5e4f39.png';

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function AgreementPage() {
  const { theme, toggleTheme } = useTheme();

  // Parse URL params for pre-fill
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
    const newFields = { ...fields };
    const prefilledKeys = new Set<string>();
    params.forEach((val, key) => {
      const mapped = URL_PARAM_MAP[key];
      if (mapped && val) {
        (newFields as Record<string, string>)[mapped] = val;
        prefilledKeys.add(mapped);
      }
    });
    setFields(newFields);
    setPrefilled(prefilledKeys);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step state
  const [stepIdx, setStepIdx] = useState(0);
  const [animDir, setAnimDir] = useState<'enter' | 'exit'>('enter');
  const [animKey, setAnimKey] = useState(0);

  // TOS state
  const [tosRead, setTosRead] = useState(false);
  const [tosAgreed, setTosAgreed] = useState(false);
  const tosRef = useRef<HTMLDivElement>(null);

  // Agreement acks
  const [acksChecked, setAcksChecked] = useState<boolean[]>(Array(ACK_ITEMS.length).fill(false));

  // Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [sigDataURL, setSigDataURL] = useState<string | null>(null);

  // PIP election (MD)
  const [pipElection, setPipElection] = useState<PipElection>(null);

  // State data
  const stateData: StateData = STATE_DATA[fields.agreementState] || STATE_DATA['OTHER'];
  const hasAddons = stateData.addons.length > 0;

  // Effective steps (skip addons if no addons for state)
  const effectiveSteps = STEPS.filter(s => s.id !== 'addons' || hasAddons);

  const currentStep = effectiveSteps[stepIdx];

  // ── NAVIGATION ──────────────────────────────────────────────────────────────
  const goTo = useCallback((idx: number) => {
    setAnimDir('enter');
    setAnimKey(k => k + 1);
    setStepIdx(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => {
    if (stepIdx < effectiveSteps.length - 1) goTo(stepIdx + 1);
  }, [stepIdx, effectiveSteps.length, goTo]);

  const goBack = useCallback(() => {
    if (stepIdx > 0) goTo(stepIdx - 1);
  }, [stepIdx, goTo]);

  // ── FIELD UPDATE ────────────────────────────────────────────────────────────
  const setField = (key: keyof MemberFields, val: string) => {
    setFields(f => ({ ...f, [key]: val }));
  };

  // ── TOS SCROLL ──────────────────────────────────────────────────────────────
  const handleTosScroll = () => {
    const el = tosRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setTosRead(true);
    }
  };

  // ── SIGNATURE CANVAS ────────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSigning(true);
    lastPoint.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isSigning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = theme === 'dark' ? '#ffffff' : '#171b31';
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
    if (hasSig && canvasRef.current) {
      setSigDataURL(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    setSigDataURL(null);
  };

  // ── PRINT ───────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const printHTML = buildPrintHTML(fields, stateData, sigDataURL, pipElection);
    // Inject into DOM and trigger print
    let printDiv = document.getElementById('print-output');
    if (printDiv) printDiv.remove();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = printHTML;
    const newPrintDiv = wrapper.querySelector('#print-output') as HTMLElement;
    if (newPrintDiv) {
      newPrintDiv.style.display = 'none';
      document.body.appendChild(newPrintDiv);
    }
    window.print();
  };

  // ── VALIDATION ──────────────────────────────────────────────────────────────
  const canProceedInfo = fields.memberName && fields.agreementState;
  const canProceedTos = tosRead && tosAgreed;
  const canProceedAgreement = acksChecked.every(Boolean);
  const canProceedSign = hasSig && fields.printedName;
  const canProceedAddons = !hasAddons || (
    stateData.addons.includes('md-pip') ? pipElection !== null : true
  );

  const canProceed = () => {
    switch (currentStep?.id) {
      case 'welcome': return true;
      case 'info': return !!canProceedInfo;
      case 'tos': return canProceedTos;
      case 'agreement': return canProceedAgreement;
      case 'sign': return !!canProceedSign;
      case 'addons': return canProceedAddons;
      default: return true;
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const progressPct = effectiveSteps.length > 1
    ? (stepIdx / (effectiveSteps.length - 1)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-50 whip-navy shadow-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <img
            src={LOGO_URL}
            alt="Whip"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-xs font-medium uppercase tracking-widest hidden sm:block">
              {currentStep?.label}
            </span>
            <button
              onClick={toggleTheme}
              className="text-white/60 hover:text-white transition-colors p-1.5 rounded"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%`, backgroundColor: '#ff6221' }}
          />
        </div>
      </header>

      {/* ── STEP INDICATORS ── */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-[57px] z-40">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-none py-2">
            {effectiveSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === stepIdx;
              const isDone = idx < stepIdx;
              return (
                <div key={step.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => idx < stepIdx && goTo(idx)}
                    disabled={idx > stepIdx}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      isActive
                        ? 'text-whip-orange border-b-2 border-whip-orange'
                        : isDone
                        ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                        : 'text-muted-foreground/40 cursor-not-allowed'
                    }`}
                    style={isActive ? { color: '#ff6221', borderBottomColor: '#ff6221' } : {}}
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{idx + 1}</span>
                  </button>
                  {idx < effectiveSteps.length - 1 && (
                    <ChevronRight size={12} className="text-border mx-0.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div key={animKey} className="step-enter">
          {currentStep?.id === 'welcome' && (
            <WelcomeStep
              fields={fields}
              prefilled={prefilled}
              onNext={goNext}
            />
          )}
          {currentStep?.id === 'info' && (
            <InfoStep
              fields={fields}
              prefilled={prefilled}
              setField={setField}
              onNext={goNext}
              onBack={goBack}
              canProceed={!!canProceedInfo}
            />
          )}
          {currentStep?.id === 'tos' && (
            <TosStep
              tosRef={tosRef}
              tosRead={tosRead}
              tosAgreed={tosAgreed}
              setTosAgreed={setTosAgreed}
              onScroll={handleTosScroll}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep?.id === 'agreement' && (
            <AgreementStep
              fields={fields}
              stateData={stateData}
              acksChecked={acksChecked}
              setAcksChecked={setAcksChecked}
              onNext={goNext}
              onBack={goBack}
              canProceed={canProceedAgreement}
            />
          )}
          {currentStep?.id === 'sign' && (
            <SignStep
              fields={fields}
              setField={setField}
              canvasRef={canvasRef}
              hasSig={hasSig}
              startDraw={startDraw}
              draw={draw}
              endDraw={endDraw}
              clearSig={clearSig}
              onNext={goNext}
              onBack={goBack}
              canProceed={!!canProceedSign}
            />
          )}
          {currentStep?.id === 'addons' && (
            <AddonsStep
              stateData={stateData}
              pipElection={pipElection}
              setPipElection={setPipElection}
              onNext={goNext}
              onBack={goBack}
              canProceed={canProceedAddons}
            />
          )}
          {currentStep?.id === 'complete' && (
            <CompleteStep
              fields={fields}
              stateData={stateData}
              onPrint={handlePrint}
              onBack={goBack}
            />
          )}
        </div>
      </main>

      {/* ── BOTTOM NAV (mobile) ── */}
      {currentStep?.id !== 'welcome' && currentStep?.id !== 'complete' && (
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm py-3 px-4">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <Button variant="ghost" onClick={goBack} className="gap-2 text-sm">
              <ChevronLeft size={16} /> Back
            </Button>
            <Button
              onClick={goNext}
              disabled={!canProceed()}
              className="gap-2 text-sm text-white"
              style={{ backgroundColor: canProceed() ? '#ff6221' : undefined }}
            >
              {currentStep?.id === 'sign' ? 'Submit & Continue' : 'Continue'}
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── WELCOME STEP ─────────────────────────────────────────────────────────────
function WelcomeStep({ fields, prefilled, onNext }: {
  fields: MemberFields;
  prefilled: Set<string>;
  onNext: () => void;
}) {
  const hasPrefill = prefilled.size > 0;
  return (
    <div className="flex flex-col items-center text-center py-8 gap-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: '#171b31' }}
      >
        <FileText className="text-white" size={28} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {hasPrefill && fields.memberName
            ? `Welcome, ${fields.memberName.split(' ')[0]}`
            : 'Member Lease Agreement'}
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
          {hasPrefill
            ? 'Your information has been pre-filled. Review each section, read the Terms of Service, and sign your agreement.'
            : 'Complete your Whip membership agreement. This takes about 5 minutes. You\'ll need your driver\'s license and vehicle information.'}
        </p>
      </div>

      {hasPrefill && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-5 py-3 text-sm text-blue-800 dark:text-blue-300 max-w-sm">
          <span className="font-semibold">Pre-filled by Whip:</span> Some fields have been filled in from your reservation. You can review and update any field before signing.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm text-center mt-2">
        {[
          { icon: Shield, label: 'Secure', sub: 'Encrypted session' },
          { icon: FileText, label: '5 min', sub: 'Quick process' },
          { icon: PenLine, label: 'Legal', sub: 'Binding agreement' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Icon size={18} className="text-muted-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{sub}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={onNext}
        size="lg"
        className="mt-4 px-10 text-white font-semibold gap-2"
        style={{ backgroundColor: '#ff6221' }}
      >
        Get Started <ChevronRight size={18} />
      </Button>
    </div>
  );
}

// ── INFO STEP ────────────────────────────────────────────────────────────────
function InfoStep({ fields, prefilled, setField, onNext, onBack, canProceed }: {
  fields: MemberFields;
  prefilled: Set<string>;
  setField: (k: keyof MemberFields, v: string) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  const pf = (key: string) => prefilled.has(key) ? 'field-prefilled' : '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Your Information</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Review and complete your member details. Fields highlighted in blue were pre-filled from your reservation.
        </p>
      </div>

      {/* State selector — most important */}
      <div className="p-4 rounded-xl border-2 border-whip-orange bg-orange-50/50 dark:bg-orange-950/20">
        <Label className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2 block">
          Agreement State <span className="text-red-500">*</span>
        </Label>
        <Select value={fields.agreementState} onValueChange={v => setField('agreementState', v)}>
          <SelectTrigger className={`bg-background ${pf('agreementState')}`}>
            <SelectValue placeholder="Select state where vehicle is registered…" />
          </SelectTrigger>
          <SelectContent>
            {STATE_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">
          This determines which state-specific forms are required.
        </p>
      </div>

      {/* Personal info */}
      <SectionCard title="Personal Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Legal Name *" className={pf('memberName')}>
            <Input value={fields.memberName} onChange={e => setField('memberName', e.target.value)} placeholder="First Middle Last" className={pf('memberName')} />
          </Field>
          <Field label="Date of Birth" className={pf('dob')}>
            <Input type="date" value={fields.dob} onChange={e => setField('dob', e.target.value)} className={pf('dob')} />
          </Field>
          <Field label="Phone" className={pf('phone')}>
            <Input type="tel" value={fields.phone} onChange={e => setField('phone', e.target.value)} placeholder="(555) 000-0000" className={pf('phone')} />
          </Field>
          <Field label="Email" className={pf('email')}>
            <Input type="email" value={fields.email} onChange={e => setField('email', e.target.value)} placeholder="you@example.com" className={pf('email')} />
          </Field>
          <Field label="Driver's License Number" className={pf('dlNumber')}>
            <Input value={fields.dlNumber} onChange={e => setField('dlNumber', e.target.value)} placeholder="DL Number" className={`font-mono ${pf('dlNumber')}`} />
          </Field>
          <Field label="License State" className={pf('licenseState')}>
            <Input value={fields.licenseState} onChange={e => setField('licenseState', e.target.value)} placeholder="MD" maxLength={2} className={`uppercase ${pf('licenseState')}`} />
          </Field>
          <Field label="Street Address" className={`sm:col-span-2 ${pf('address')}`}>
            <Input value={fields.address} onChange={e => setField('address', e.target.value)} placeholder="123 Main St" className={pf('address')} />
          </Field>
          <Field label="City, State, ZIP" className={`sm:col-span-2 ${pf('cityStateZip')}`}>
            <Input value={fields.cityStateZip} onChange={e => setField('cityStateZip', e.target.value)} placeholder="Baltimore, MD 21201" className={pf('cityStateZip')} />
          </Field>
        </div>
      </SectionCard>

      {/* Reservation info */}
      <SectionCard title="Reservation Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Customer / Member ID" className={pf('customerId')}>
            <Input value={fields.customerId} onChange={e => setField('customerId', e.target.value)} className={`font-mono ${pf('customerId')}`} />
          </Field>
          <Field label="Reservation ID" className={pf('reservationId')}>
            <Input value={fields.reservationId} onChange={e => setField('reservationId', e.target.value)} className={`font-mono ${pf('reservationId')}`} />
          </Field>
          <Field label="Vehicle (Year Make Model)" className={`sm:col-span-2 ${pf('vehicle')}`}>
            <Input value={fields.vehicle} onChange={e => setField('vehicle', e.target.value)} placeholder="2022 Toyota Camry" className={pf('vehicle')} />
          </Field>
          <Field label="VIN" className={`sm:col-span-2 ${pf('vin')}`}>
            <Input value={fields.vin} onChange={e => setField('vin', e.target.value)} placeholder="17-character VIN" maxLength={17} className={`font-mono uppercase ${pf('vin')}`} />
          </Field>
          <Field label="Weekly Membership Fee ($)" className={pf('weeklyFee')}>
            <Input type="number" value={fields.weeklyFee} onChange={e => setField('weeklyFee', e.target.value)} placeholder="0.00" className={pf('weeklyFee')} />
          </Field>
          <Field label="Initial Deposit ($)" className={pf('deposit')}>
            <Input type="number" value={fields.deposit} onChange={e => setField('deposit', e.target.value)} placeholder="0.00" className={pf('deposit')} />
          </Field>
          <Field label="Start Date" className={pf('startDate')}>
            <Input type="date" value={fields.startDate} onChange={e => setField('startDate', e.target.value)} className={pf('startDate')} />
          </Field>
          <Field label="End Date" className={pf('endDate')}>
            <Input type="date" value={fields.endDate} onChange={e => setField('endDate', e.target.value)} className={pf('endDate')} />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

// ── TOS STEP ─────────────────────────────────────────────────────────────────
function TosStep({ tosRef, tosRead, tosAgreed, setTosAgreed, onScroll, onNext, onBack }: {
  tosRef: React.RefObject<HTMLDivElement | null>;
  tosRead: boolean;
  tosAgreed: boolean;
  setTosAgreed: (v: boolean) => void;
  onScroll: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Terms of Service</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Read the full Terms of Service before agreeing. Scroll to the bottom to unlock the agreement checkbox.
        </p>
      </div>

      <div className="relative">
        {!tosRead && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs px-2.5 py-1.5 rounded-full font-medium">
            <Lock size={11} /> Scroll to read
          </div>
        )}
        {tosRead && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-xs px-2.5 py-1.5 rounded-full font-medium">
            <Unlock size={11} /> Read complete
          </div>
        )}
        <div
          ref={tosRef}
          onScroll={onScroll}
          className="tos-scroll legal-text"
        >
          {TOS_TEXT.split('\n').map((line, i) => (
            line.trim() === ''
              ? <br key={i} />
              : <p key={i} className="mb-2">{line}</p>
          ))}
        </div>
      </div>

      <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
        tosRead
          ? 'border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700'
          : 'border-border bg-muted/30 opacity-50 pointer-events-none'
      }`}>
        <Checkbox
          id="tos-agree"
          checked={tosAgreed}
          onCheckedChange={v => setTosAgreed(!!v)}
          disabled={!tosRead}
        />
        <label htmlFor="tos-agree" className="text-sm leading-relaxed cursor-pointer">
          I have read and agree to the Whip <strong>Terms of Service</strong> in their entirety. I understand these terms are legally binding.
        </label>
      </div>
    </div>
  );
}

// ── AGREEMENT STEP ───────────────────────────────────────────────────────────
function AgreementStep({ fields, stateData, acksChecked, setAcksChecked, onNext, onBack, canProceed }: {
  fields: MemberFields;
  stateData: StateData;
  acksChecked: boolean[];
  setAcksChecked: (v: boolean[]) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  const toggleAck = (i: number) => {
    const next = [...acksChecked];
    next[i] = !next[i];
    setAcksChecked(next);
  };

  const allChecked = acksChecked.every(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Member Lease Agreement</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Review the key terms of your agreement, then check each acknowledgment below.
        </p>
      </div>

      {/* Key terms summary */}
      <div className="space-y-3">
        {[
          {
            title: 'Protection Plan',
            body: `Your weekly fee includes physical damage coverage (comprehensive & collision). You are responsible for a Damage Fee of the lesser of actual repair cost or $1,000 per occurrence.`,
          },
          {
            title: 'Liability Benefit',
            body: stateData.liabilityNote,
          },
          {
            title: 'Authorized Operators',
            body: 'Only you may operate the vehicle. Unauthorized operation is a material breach and may result in immediate vehicle recovery.',
          },
          {
            title: 'Accident Reporting',
            body: 'You must report any accident, collision, theft, or damage within 24 hours by calling 855-861-9401 or emailing claims@drivewhip.com.',
          },
          {
            title: 'Dispute Resolution',
            body: 'All disputes are resolved by binding arbitration. You waive the right to a jury trial and class action participation.',
          },
        ].map(({ title, body }) => (
          <div key={title} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#ff6221' }} />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</span>
            </div>
            <p className="text-sm legal-text">{body}</p>
          </div>
        ))}
        {stateData.statDisclosure && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">State Disclosure</span>
            </div>
            <p className="text-sm legal-text">{stateData.statDisclosure}</p>
          </div>
        )}
      </div>

      {/* Acknowledgments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Member Acknowledgments
          </h3>
          <span className="text-xs text-muted-foreground">
            {acksChecked.filter(Boolean).length} / {ACK_ITEMS.length}
          </span>
        </div>
        <div className="space-y-2">
          {ACK_ITEMS.map((item, i) => (
            <div
              key={i}
              onClick={() => toggleAck(i)}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                acksChecked[i]
                  ? 'border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <Checkbox
                checked={acksChecked[i]}
                onCheckedChange={() => toggleAck(i)}
                className="mt-0.5 shrink-0"
              />
              <span className="text-sm legal-text leading-snug">{item}</span>
            </div>
          ))}
        </div>
        {!allChecked && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Check all {ACK_ITEMS.length} acknowledgments to continue.
          </p>
        )}
      </div>
    </div>
  );
}

// ── SIGN STEP ────────────────────────────────────────────────────────────────
function SignStep({ fields, setField, canvasRef, hasSig, startDraw, draw, endDraw, clearSig, onNext, onBack, canProceed }: {
  fields: MemberFields;
  setField: (k: keyof MemberFields, v: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  hasSig: boolean;
  startDraw: (e: React.MouseEvent | React.TouchEvent) => void;
  draw: (e: React.MouseEvent | React.TouchEvent) => void;
  endDraw: () => void;
  clearSig: () => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Sign Your Agreement</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Draw your signature in the box below, then type your full name to confirm.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">
            Signature <span className="text-red-500">*</span>
          </Label>
          {hasSig && (
            <button
              onClick={clearSig}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>
        <div className="sig-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={600}
            height={160}
            className="w-full h-40 block"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        {!hasSig && (
          <p className="text-xs text-muted-foreground mt-1.5 text-center">
            Draw your signature above using mouse or touch
          </p>
        )}
      </div>

      <Field label="Printed Full Name *">
        <Input
          value={fields.printedName}
          onChange={e => setField('printedName', e.target.value)}
          placeholder="Type your full legal name"
          className="text-base"
        />
      </Field>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm legal-text">
        By signing above and typing my name, I certify that I have read this Member Lease Agreement and the Whip Terms of Service in their entirety, that I understand and agree to all terms and conditions, and that this agreement is legally binding upon my execution.
      </div>
    </div>
  );
}

// ── ADDONS STEP ──────────────────────────────────────────────────────────────
function AddonsStep({ stateData, pipElection, setPipElection, onNext, onBack, canProceed }: {
  stateData: StateData;
  pipElection: PipElection;
  setPipElection: (v: PipElection) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{stateData.name} Required Forms</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {stateData.name} law requires the following elections before your agreement is complete.
        </p>
      </div>

      {stateData.addons.includes('md-pip') && (
        <MdPipAddon pipElection={pipElection} setPipElection={setPipElection} />
      )}
      {stateData.addons.includes('ga-um') && (
        <GaUmAddon />
      )}
      {stateData.addons.includes('fl-um') && (
        <FlUmAddon />
      )}
      {stateData.addons.includes('pa-pip') && (
        <PaPipAddon />
      )}
    </div>
  );
}

function MdPipAddon({ pipElection, setPipElection }: {
  pipElection: PipElection;
  setPipElection: (v: PipElection) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-border p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Maryland PIP Election</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Personal Injury Protection (PIP) pays medical expenses and lost wages regardless of fault. You must elect or waive this coverage.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setPipElection('full')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              pipElection === 'full'
                ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
                : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${pipElection === 'full' ? 'border-green-500' : 'border-muted-foreground'}`}>
                {pipElection === 'full' && <div className="w-2 h-2 rounded-full bg-green-500" />}
              </div>
              <span className="font-semibold text-sm">Elect PIP Coverage</span>
            </div>
            <p className="text-xs text-muted-foreground">$2,500 per person per accident for medical expenses and lost wages, regardless of fault.</p>
          </button>
          <button
            onClick={() => setPipElection('waive')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              pipElection === 'waive'
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${pipElection === 'waive' ? 'border-amber-500' : 'border-muted-foreground'}`}>
                {pipElection === 'waive' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
              </div>
              <span className="font-semibold text-sm">Waive PIP Coverage</span>
            </div>
            <p className="text-xs text-muted-foreground">I understand I will have no PIP benefits. I waive this coverage affirmatively.</p>
          </button>
        </div>
        {pipElection === 'waive' && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300">
            <strong>Waiver Notice:</strong> By waiving PIP, you and your passengers will have no PIP benefits. A separate waiver form will be included in your printed agreement.
          </div>
        )}
      </div>
    </div>
  );
}

function GaUmAddon() {
  return (
    <div className="rounded-xl border-2 border-border p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Georgia UM Coverage</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Per O.C.G.A. § 33-7-11, you are rejecting Uninsured Motorist coverage for this lease vehicle. A signed rejection form will be included in your printed agreement.
      </p>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 text-sm text-blue-800 dark:text-blue-300">
        <CheckCircle2 size={16} className="shrink-0" />
        UM Rejection form will be included in your printed agreement.
      </div>
    </div>
  );
}

function FlUmAddon() {
  return (
    <div className="rounded-xl border-2 border-border p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Florida UM/UIM Coverage</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Per Florida Statutes § 627.727, you are rejecting Uninsured/Underinsured Motorist coverage for this lease vehicle. A signed rejection form will be included in your printed agreement.
      </p>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 text-sm text-blue-800 dark:text-blue-300">
        <CheckCircle2 size={16} className="shrink-0" />
        UM/UIM Rejection form will be included in your printed agreement.
      </div>
    </div>
  );
}

function PaPipAddon() {
  return (
    <div className="rounded-xl border-2 border-border p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Pennsylvania Coverage Elections</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Pennsylvania requires elections for First Party Medical Benefits and UM/UIM coverage. Both are being rejected per your lease terms. A signed election form will be included in your printed agreement.
      </p>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 text-sm text-blue-800 dark:text-blue-300">
        <CheckCircle2 size={16} className="shrink-0" />
        PA coverage election form will be included in your printed agreement.
      </div>
    </div>
  );
}

// ── COMPLETE STEP ────────────────────────────────────────────────────────────
function CompleteStep({ fields, stateData, onPrint, onBack }: {
  fields: MemberFields;
  stateData: StateData;
  onPrint: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
        style={{ backgroundColor: '#171b31' }}
      >
        <CheckCircle2 className="text-white" size={36} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Agreement Complete</h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
          {fields.memberName
            ? `Thank you, ${fields.memberName.split(' ')[0]}. Your Whip Member Lease Agreement for ${stateData.name} is ready.`
            : `Your Whip Member Lease Agreement for ${stateData.name} is ready.`}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="rounded-xl border border-border p-4 text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Included in your package</div>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={14} className="text-green-500 shrink-0" />
              Member Lease Agreement (3 pages)
            </li>
            {stateData.addons.includes('md-pip') && (
              <>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  Maryland PIP Notice
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  Maryland PIP Waiver (if applicable)
                </li>
              </>
            )}
            {stateData.addons.includes('ga-um') && (
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                Georgia UM Rejection Form
              </li>
            )}
            {stateData.addons.includes('fl-um') && (
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                Florida UM/UIM Rejection Form
              </li>
            )}
            {stateData.addons.includes('pa-pip') && (
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                Pennsylvania Coverage Election Form
              </li>
            )}
          </ul>
        </div>
      </div>

      <Button
        onClick={onPrint}
        size="lg"
        className="px-10 text-white font-semibold gap-2"
        style={{ backgroundColor: '#171b31' }}
      >
        <Printer size={18} /> Print / Save PDF
      </Button>

      <p className="text-xs text-muted-foreground max-w-xs">
        Use your browser's print dialog to save as PDF. All pages including state-specific forms will be included.
      </p>
    </div>
  );
}

// ── SHARED UI HELPERS ────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#ff6221' }} />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, className }: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}


