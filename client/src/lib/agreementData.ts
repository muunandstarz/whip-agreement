// ── WHIP AGREEMENT DATA ──────────────────────────────────────────────────────
// Design: Precision Legal — white canvas, navy authority, orange action
// All legal text is verbatim from approved Whip agreement documents

export interface StateData {
  code: string;
  name: string;
  govLaw: string;
  liabilityNote: string;
  stateNote?: string;
  statDisclosure?: string;
  addons: AddonKey[];
}

export type AddonKey = 'md-pip' | 'ga-um' | 'fl-um' | 'pa-pip';

export const STATE_DATA: Record<string, StateData> = {
  MD: {
    code: 'MD',
    name: 'Maryland',
    govLaw: 'Maryland',
    liabilityNote: "Whip's liability benefit applies at the statutory minimum limits required by Maryland when the Member's rideshare application is off (Period 0). Whip's liability benefit does not apply during any period in which the Member is active on a TNC platform.",
    stateNote: "Maryland — PIP and Uninsured/Underinsured Motorist coverage elections are governed by separate forms provided at enrollment.",
    statDisclosure: "Maryland — Md. Criminal Law § 7-205: A person who leases a motor vehicle and willfully fails to return it may be guilty of a misdemeanor, punishable by up to one year imprisonment or a fine up to $500, or both. A written demand must be mailed at least 5 days before prosecution may begin.",
    addons: ['md-pip'],
  },
  GA: {
    code: 'GA',
    name: 'Georgia',
    govLaw: 'Georgia',
    liabilityNote: "Whip's liability benefit applies at the statutory minimum limits required by Georgia when the Member's rideshare application is off (Period 0). Whip's liability benefit does not apply during any period in which the Member is active on a TNC platform.",
    addons: ['ga-um'],
  },
  FL: {
    code: 'FL',
    name: 'Florida',
    govLaw: 'Florida',
    liabilityNote: "Whip's liability benefit applies at the statutory minimum limits required by Florida when the Member's rideshare application is off (Period 0). Whip's liability benefit does not apply during any period in which the Member is active on a TNC platform.",
    addons: ['fl-um'],
  },
  PA: {
    code: 'PA',
    name: 'Pennsylvania',
    govLaw: 'Pennsylvania',
    liabilityNote: "Whip's liability benefit applies at the statutory minimum limits required by Pennsylvania when the Member's rideshare application is off (Period 0). Whip's liability benefit does not apply during any period in which the Member is active on a TNC platform.",
    addons: ['pa-pip'],
  },
  IL: {
    code: 'IL',
    name: 'Illinois',
    govLaw: 'Illinois',
    liabilityNote: "Whip's liability benefit applies at the statutory minimum limits required by Illinois when the Member's rideshare application is off (Period 0). Whip's liability benefit does not apply during any period in which the Member is active on a TNC platform.",
    addons: [],
  },
  TX: {
    code: 'TX',
    name: 'Texas',
    govLaw: 'Texas',
    liabilityNote: "Whip's liability benefit applies at the statutory minimum limits required by Texas when the Member's rideshare application is off (Period 0). Whip's liability benefit does not apply during any period in which the Member is active on a TNC platform.",
    addons: [],
  },
  VA: {
    code: 'VA',
    name: 'Virginia',
    govLaw: 'Virginia',
    liabilityNote: "Whip's liability benefit applies at the statutory minimum limits required by Virginia when the Member's rideshare application is off (Period 0). Whip's liability benefit does not apply during any period in which the Member is active on a TNC platform.",
    addons: [],
  },
  MA: {
    code: 'MA',
    name: 'Massachusetts',
    govLaw: 'Massachusetts',
    liabilityNote: "Whip's liability benefit applies at the statutory minimum limits required by Massachusetts when the Member's rideshare application is off (Period 0). Whip's liability benefit does not apply during any period in which the Member is active on a TNC platform.",
    addons: [],
  },
  OTHER: {
    code: 'OTHER',
    name: 'Other State',
    govLaw: 'the state in which the vehicle is registered',
    liabilityNote: "Whip's liability benefit applies at the statutory minimum limits required by applicable state law when the Member's rideshare application is off (Period 0). Whip's liability benefit does not apply during any period in which the Member is active on a TNC platform.",
    addons: [],
  },
};

export const STATE_OPTIONS = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export const TOS_TEXT = `
WHIP TERMS OF SERVICE
Metrocars Leasing Corp. d/b/a Whip

Last Updated: January 1, 2025

PLEASE READ THESE TERMS OF SERVICE CAREFULLY. BY ACCESSING OR USING THE WHIP PLATFORM, SIGNING A MEMBER LEASE AGREEMENT, OR TAKING POSSESSION OF A VEHICLE, YOU AGREE TO BE BOUND BY THESE TERMS.

1. ACCEPTANCE OF TERMS

These Terms of Service ("Terms") constitute a legally binding agreement between you ("Member") and Metrocars Leasing Corp. d/b/a Whip ("Whip," "we," "us," or "our"), a Maryland corporation with its principal place of business at 14670 Southlawn Lane, Rockville, MD 20850. By using any Whip service, platform, or vehicle, you accept these Terms in full.

2. SERVICES DESCRIPTION

Whip provides vehicle leasing services to licensed Transportation Network Company (TNC) drivers operating on platforms including but not limited to Uber, Lyft, DoorDash, Amazon Flex, and similar gig economy platforms. Whip leases vehicles exclusively for commercial rideshare and delivery operations. Personal use of leased vehicles is not permitted without prior written authorization from Whip.

3. ELIGIBILITY REQUIREMENTS

To be eligible for Whip membership, you must: (a) be at least 21 years of age; (b) hold a valid, unsuspended, and unrevoked driver's license; (c) maintain active approval status on at least one TNC platform; (d) pass Whip's background screening process; (e) provide valid payment information; and (f) comply with all applicable laws and regulations. Whip reserves the right to deny or revoke membership at any time for any lawful reason.

4. VEHICLE USE AND RESTRICTIONS

Members may only operate leased vehicles for lawful TNC rideshare and delivery activities. The following are strictly prohibited: (a) use of the vehicle for personal travel beyond 150 miles from the original pickup location without prior written approval; (b) operation by any person other than the Member identified in the Member Lease Agreement; (c) use of the vehicle for any illegal purpose; (d) smoking, vaping, or use of controlled substances in the vehicle; (e) transporting animals without prior written approval; (f) any modification to the vehicle; (g) towing or hauling with the vehicle; (h) operation of the vehicle outside the United States.

5. PAYMENT TERMS

Weekly membership fees are due and payable in advance. Whip will charge the payment method on file on the agreed billing date. In the event of a failed payment, Whip may: (a) assess a returned payment fee of up to $35; (b) suspend vehicle access; (c) terminate the membership; and/or (d) recover the vehicle without notice. All fees, including damage fees, fines, tolls, and other charges, are due within 24 hours of invoice. Member authorizes Whip to charge the payment method on file for all amounts owed under this Agreement.

6. PROTECTION PLAN

The Protection Plan included in the weekly membership fee provides physical damage coverage (comprehensive and collision) on the vehicle as maintained by Metrocars Leasing Corp. as the registered owner. The Member is responsible for a Damage Fee of the lesser of actual repair cost or $1,000.00 per occurrence. The Protection Plan does not cover: (a) damage resulting from intentional or reckless conduct; (b) damage occurring while the vehicle is operated by an unauthorized driver; (c) damage occurring while the Member is in violation of these Terms or applicable law; (d) personal property inside the vehicle; or (e) consequential or incidental damages.

7. ACCIDENT AND INCIDENT REPORTING

Members must report any accident, collision, theft, or vehicle damage to Whip within 24 hours of the incident by calling 855-861-9401 or visiting drivewhip.com and clicking "File a Claim". Failure to timely report may result in the Member bearing full financial responsibility for resulting damages. Members must cooperate fully with Whip's claims investigation, including providing recorded statements, submitting to examination under oath, and executing all necessary documents.

8. VEHICLE RETURN

Upon termination of membership for any reason, the Member must immediately return the vehicle to Whip in the same condition as received, ordinary wear and tear excepted. Failure to return the vehicle within 24 hours of termination notice may constitute theft and may result in criminal prosecution. Whip reserves the right to recover the vehicle without notice in the event of abandonment, material breach, or nonpayment.

9. SUBROGATION

To the extent Whip makes any payment arising from a loss caused by a third party, the Member hereby assigns to Whip all rights of recovery against such third party. The Member agrees to cooperate with Whip's pursuit of any subrogation claim and shall take no action that would impair Whip's subrogation rights.

10. DISPUTE RESOLUTION AND ARBITRATION

ALL DISPUTES ARISING OUT OF OR RELATING TO THESE TERMS OR ANY WHIP SERVICE SHALL BE RESOLVED BY BINDING ARBITRATION ON AN INDIVIDUAL BASIS. YOU WAIVE YOUR RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN ANY CLASS ACTION OR REPRESENTATIVE PROCEEDING. Arbitration shall be conducted by the American Arbitration Association under its Consumer Arbitration Rules. This arbitration provision is governed by the Federal Arbitration Act. Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in a court of competent jurisdiction to prevent irreparable harm.

11. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WHIP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, ARISING OUT OF OR RELATED TO THESE TERMS OR ANY WHIP SERVICE, EVEN IF WHIP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. WHIP'S TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING OUT OF OR RELATED TO THESE TERMS SHALL NOT EXCEED THE TOTAL FEES PAID BY YOU TO WHIP IN THE THREE (3) MONTHS PRECEDING THE CLAIM.

12. INDEMNIFICATION

You agree to indemnify, defend, and hold harmless Whip and its officers, directors, employees, agents, and successors from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of any Whip vehicle or service; (b) your violation of these Terms; (c) your violation of any applicable law or regulation; or (d) any accident, injury, or property damage caused by you.

13. PRIVACY AND DATA

Whip collects and uses vehicle telematics, location data, and usage information to manage the fleet, enforce these Terms, and improve services. By accepting these Terms, you consent to such collection and use. Whip will not sell your personal information to third parties. Whip may share information with TNC platforms, law enforcement, and insurance carriers as required by law or contract.

14. MODIFICATIONS

Whip reserves the right to modify these Terms at any time. Notice of material changes will be provided via email or in-app notification. Continued use of Whip services after notice constitutes acceptance of the modified Terms.

15. GOVERNING LAW

These Terms shall be governed by and construed in accordance with the laws of the state in which your Member Lease Agreement is executed, without regard to conflict of law principles.

16. ENTIRE AGREEMENT

These Terms, together with the Member Lease Agreement and any applicable state-specific addenda, constitute the entire agreement between you and Whip with respect to the subject matter hereof and supersede all prior agreements and understandings.

By signing the Member Lease Agreement, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service in their entirety.

Metrocars Leasing Corp. d/b/a Whip
14670 Southlawn Lane, Rockville MD 20850
855-861-9401 | drivewhip.com
`;

export const ACK_ITEMS = [
  "To arrive punctually for all scheduled service appointments and to notify Whip in advance of any delay or need to reschedule.",
  "To report any and all vehicle damage or accidents to Whip within 24 hours of occurrence.",
  "To cooperate fully with Whip's claims investigation process, including providing a recorded statement, submitting to examination under oath if requested, and executing any documents necessary to protect Whip's rights.",
  "To remain current on all recurring membership payments and to pay any additional invoices within 24 hours of receipt.",
  "Not to operate or transport the vehicle beyond a 150-mile radius from the original pickup location without prior written authorization from Whip.",
  "That Whip may charge the payment method on file for all amounts owed under this Agreement and may re-initiate any payment charge that is dishonored or rejected.",
  "That the driver's license presented is currently valid and will remain valid, unsuspended, unexpired, and unrevoked until the vehicle is returned to Whip.",
  "To allow Whip to collect vehicle usage and location data as set forth in the Terms of Service.",
  "That disputes shall be resolved through binding arbitration as set forth in the Terms of Service, and that I waive my right to a jury trial and class action participation.",
];

// URL parameter field mapping for Drive+/Smartsheets pre-fill
export const URL_PARAM_MAP: Record<string, string> = {
  name: 'memberName',
  member_name: 'memberName',
  memberName: 'memberName',
  id: 'customerId',
  customer_id: 'customerId',
  customerId: 'customerId',
  res_id: 'reservationId',
  reservation_id: 'reservationId',
  reservationId: 'reservationId',
  vehicle: 'vehicle',
  ymm: 'vehicle',
  vin: 'vin',
  // DL and license state can be pre-filled via URL for staff-initiated flows
  dl: 'dlNumber',
  dlNumber: 'dlNumber',
  driver_license: 'dlNumber',
  licenseState: 'licenseState',
  license_state: 'licenseState',
  // Phone and email pre-fill
  phone: 'phone',
  email: 'email',
  dob: 'dob',
  date_of_birth: 'dob',
  address: 'address',
  city_state_zip: 'cityStateZip',
  cityStateZip: 'cityStateZip',
  // Weekly fee — short alias
  weekly: 'weeklyFee',
  weekly_fee: 'weeklyFee',
  weeklyFee: 'weeklyFee',
  deposit: 'deposit',
  // Dates — short aliases
  start: 'startDate',
  start_date: 'startDate',
  startDate: 'startDate',
  end: 'endDate',
  end_date: 'endDate',
  endDate: 'endDate',
  // State — short alias
  state: 'agreementState',
  agreement_state: 'agreementState',
  agreementState: 'agreementState',
};

// ── MARKET DATA ───────────────────────────────────────────────────────────────
export interface MarketInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  states: string[]; // garaging states served by this market
}

export const MARKETS: MarketInfo[] = [
  {
    // Rockville — Maryland (DC Metro North)
    name: 'Rockville',
    address: '14670 Southlawn Lane',
    city: 'Rockville',
    state: 'MD',
    zip: '20850',
    phone: '(301) 424-5678',
    states: ['MD'],
  },
  {
    // Glen Burnie — Maryland (Baltimore Metro)
    name: 'Glen Burnie',
    address: '7939 Ritchie Hwy',
    city: 'Glen Burnie',
    state: 'MD',
    zip: '21061',
    phone: '(410) 766-1234',
    states: [],  // MD members are assigned to a specific market on import; both are MD
  },
  {
    name: 'Atlanta',
    address: '2700 Northeast Expy NE',
    city: 'Atlanta',
    state: 'GA',
    zip: '30345',
    phone: '(404) 321-9876',
    states: ['GA'],
  },
  {
    name: 'Chicago',
    address: '4200 W Lawrence Ave',
    city: 'Chicago',
    state: 'IL',
    zip: '60630',
    phone: '(773) 555-0100',
    states: ['IL'],
  },
  {
    name: 'Dallas',
    address: '9800 Harry Hines Blvd',
    city: 'Dallas',
    state: 'TX',
    zip: '75220',
    phone: '(214) 555-0700',
    states: ['TX'],
  },
  {
    name: 'Philadelphia',
    address: '3901 Market St',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19104',
    phone: '(215) 555-0300',
    states: ['PA'],
  },
  {
    name: 'Boston',
    address: '1200 Hyde Park Ave',
    city: 'Boston',
    state: 'MA',
    zip: '02136',
    phone: '(617) 555-0600',
    states: ['MA'],
  },
  {
    // Miami — South Florida
    name: 'Miami',
    address: '8400 NW 36th St',
    city: 'Doral',
    state: 'FL',
    zip: '33166',
    phone: '(305) 555-0400',
    states: ['FL'],
  },
  {
    // Orlando — Central Florida
    name: 'Orlando',
    address: '5555 Semoran Blvd',
    city: 'Orlando',
    state: 'FL',
    zip: '32822',
    phone: '(407) 555-0500',
    states: [],  // FL members assigned to Miami or Orlando on import
  },
  {
    name: 'Richmond',
    address: '4901 Midlothian Turnpike',
    city: 'Richmond',
    state: 'VA',
    zip: '23234',
    phone: '(804) 555-0200',
    states: ['VA'],
  },
];

export function getMarketForState(stateCode: string): MarketInfo {
  return MARKETS.find(m => m.states.includes(stateCode)) ?? MARKETS[0];
}

// ── COVERAGE DATA ─────────────────────────────────────────────────────────────
export interface CoverageInfo {
  protectionPlan: {
    name: string;
    description: string;
    memberResponsibility: string;
    exclusions: string[];
  };
  liability: {
    carrier: string;
    limits: string;
    description: string;
  };
  pip?: {
    name: string;
    description: string;
    limit: string;
  };
  um?: {
    name: string;
    description: string;
    status: string;
  };
}

export const STATE_COVERAGE: Record<string, CoverageInfo> = {
  MD: {
    protectionPlan: {
      name: 'Whip Protection Plan',
      description: 'Physical damage coverage (comprehensive & collision) maintained by Metrocars Leasing Corp. as the registered owner.',
      memberResponsibility: '$1,000 per occurrence (or actual repair cost if less)',
      exclusions: ['Intentional or reckless damage', 'Unauthorized driver', 'Violation of Terms', 'Personal property', 'Consequential damages'],
    },
    liability: {
      carrier: 'Metrocars Leasing Corp. (via Metro Cars)',
      limits: '30/60/15 — $30,000 bodily injury per person / $60,000 per accident / $15,000 property damage',
      description: 'Liability coverage applies during Period 0 (rideshare app off) only. Does not apply while active on any TNC platform.',
    },
    pip: {
      name: 'Personal Injury Protection (PIP)',
      description: 'Pays medical expenses and lost wages regardless of fault for you and your passengers.',
      limit: '$2,500 per person (Maryland statutory minimum)',
    },
  },
  GA: {
    protectionPlan: {
      name: 'Whip Protection Plan',
      description: 'Physical damage coverage (comprehensive & collision) maintained by Metrocars Leasing Corp. as the registered owner.',
      memberResponsibility: '$1,000 per occurrence (or actual repair cost if less)',
      exclusions: ['Intentional or reckless damage', 'Unauthorized driver', 'Violation of Terms', 'Personal property', 'Consequential damages'],
    },
    liability: {
      carrier: 'Metrocars Leasing Corp. (via Metro Cars)',
      limits: '25/50/25 — $25,000 bodily injury per person / $50,000 per accident / $25,000 property damage',
      description: 'Liability coverage applies during Period 0 (rideshare app off) only. Does not apply while active on any TNC platform.',
    },
    um: {
      name: 'Uninsured Motorist (UM)',
      description: 'Covers damages caused by a driver with no insurance or insufficient insurance.',
      status: 'Rejected per lease terms (O.C.G.A. § 33-7-11)',
    },
  },
  FL: {
    protectionPlan: {
      name: 'Whip Protection Plan',
      description: 'Physical damage coverage (comprehensive & collision) maintained by Metrocars Leasing Corp. as the registered owner.',
      memberResponsibility: '$1,000 per occurrence (or actual repair cost if less)',
      exclusions: ['Intentional or reckless damage', 'Unauthorized driver', 'Violation of Terms', 'Personal property', 'Consequential damages'],
    },
    liability: {
      carrier: 'Metrocars Leasing Corp. (via Metro Cars)',
      limits: '10/20/10 — $10,000 bodily injury per person / $20,000 per accident / $10,000 property damage',
      description: 'Liability coverage applies during Period 0 (rideshare app off) only. Does not apply while active on any TNC platform.',
    },
    um: {
      name: 'Uninsured/Underinsured Motorist (UM/UIM)',
      description: 'Covers damages caused by a driver with no insurance or insufficient insurance.',
      status: 'Rejected per lease terms (§ 627.727)',
    },
  },
  PA: {
    protectionPlan: {
      name: 'Whip Protection Plan',
      description: 'Physical damage coverage (comprehensive & collision) maintained by Metrocars Leasing Corp. as the registered owner.',
      memberResponsibility: '$1,000 per occurrence (or actual repair cost if less)',
      exclusions: ['Intentional or reckless damage', 'Unauthorized driver', 'Violation of Terms', 'Personal property', 'Consequential damages'],
    },
    liability: {
      carrier: 'Metrocars Leasing Corp. (via Metro Cars)',
      limits: '15/30/5 — $15,000 bodily injury per person / $30,000 per accident / $5,000 property damage',
      description: 'Liability coverage applies during Period 0 (rideshare app off) only. Does not apply while active on any TNC platform.',
    },
    pip: {
      name: 'First Party Medical Benefits',
      description: 'Pays medical expenses for you and passengers regardless of fault.',
      limit: 'Rejected per lease terms',
    },
    um: {
      name: 'Uninsured/Underinsured Motorist (UM/UIM)',
      description: 'Covers damages caused by a driver with no insurance or insufficient insurance.',
      status: 'Rejected per lease terms',
    },
  },
  DEFAULT: {
    protectionPlan: {
      name: 'Whip Protection Plan',
      description: 'Physical damage coverage (comprehensive & collision) maintained by Metrocars Leasing Corp. as the registered owner.',
      memberResponsibility: '$1,000 per occurrence (or actual repair cost if less)',
      exclusions: ['Intentional or reckless damage', 'Unauthorized driver', 'Violation of Terms', 'Personal property', 'Consequential damages'],
    },
    liability: {
      carrier: 'Metrocars Leasing Corp. (via Metro Cars)',
      limits: 'State minimum limits',
      description: 'Liability coverage applies during Period 0 (rideshare app off) only. Does not apply while active on any TNC platform.',
    },
  },
};

export function getCoverageForState(stateCode: string): CoverageInfo {
  return STATE_COVERAGE[stateCode] ?? STATE_COVERAGE['DEFAULT'];
}

// ── HELP DESK ─────────────────────────────────────────────────────────────────
export const HELP_DESK_PHONE = '855-861-9401';       // help desk phone line (call)
export const HELP_DESK_TEXT_LINE = '855-861-9401';   // help desk text line (SMS)

// ── TRIP HISTORY (demo data) ──────────────────────────────────────────────────
export type TripType = 'reservation' | 'swap' | 'loaner';

export interface TripRecord {
  id: string;
  type: TripType;
  vehicle: string; // "2024 Tesla Model Y"
  vin: string;     // full VIN — display last 6
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // null = current/active
  notes?: string;
}

/**
 * Generate a plausible demo trip history based on the member's current vehicle.
 * The current reservation is always the most recent entry.
 */
export function buildDemoTripHistory(
  currentVehicle: string,
  currentVin: string,
  currentStartDate: string,
  currentEndDate: string
): TripRecord[] {
  // Parse start date to compute prior dates
  const start = currentStartDate ? new Date(currentStartDate + 'T12:00:00') : new Date();

  const offset = (days: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  return [
    // Current reservation (active)
    {
      id: 'res-current',
      type: 'reservation',
      vehicle: currentVehicle || '2024 Tesla Model Y Long Range',
      vin: currentVin || '5YJYGDEE9MF123456',
      startDate: currentStartDate || offset(0),
      endDate: currentEndDate || null,
    },
    // Swap — 3 days before current start
    {
      id: 'swap-01',
      type: 'swap',
      vehicle: '2023 Toyota Camry XSE',
      vin: '4T1BZ1HK7PU123789',
      startDate: offset(90),
      endDate: offset(3),
      notes: 'Swap — maintenance on prior vehicle',
    },
    // Prior reservation
    {
      id: 'res-02',
      type: 'reservation',
      vehicle: '2023 Toyota Camry XSE',
      vin: '4T1BZ1HK7PU123789',
      startDate: offset(270),
      endDate: offset(90),
    },
    // Loaner
    {
      id: 'loaner-01',
      type: 'loaner',
      vehicle: '2022 Honda Accord Sport',
      vin: '1HGCV1F34NA012345',
      startDate: offset(310),
      endDate: offset(305),
      notes: 'Loaner — accident repair',
    },
    // First reservation
    {
      id: 'res-01',
      type: 'reservation',
      vehicle: '2022 Nissan Altima SV',
      vin: '1N4BL4BV3NN123456',
      startDate: offset(540),
      endDate: offset(310),
    },
  ];
}

// ── INVOICE DATA (demo) ───────────────────────────────────────────────────────
export interface InvoiceLineItem {
  label: string;
  amount: number; // in dollars
  type: 'weekly' | 'ticket' | 'toll' | 'late' | 'credit';
  date?: string;
  note?: string;
}

export interface PastInvoice {
  id: string;
  period: string;
  total: number;
  paid: boolean;
  date: string;
}

export interface InvoiceData {
  currentBalance: number;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  pastInvoices: PastInvoice[];
}

/**
 * Build demo invoice data based on the member's weekly fee.
 */
export function buildDemoInvoice(weeklyFee: string, startDate: string): InvoiceData {
  const weekly = parseFloat(weeklyFee) || 285;

  const start = startDate ? new Date(startDate + 'T12:00:00') : new Date();
  const dueDate = new Date(start);
  dueDate.setDate(dueDate.getDate() + 7);
  const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const lineItems: InvoiceLineItem[] = [
    { label: 'Weekly Rental Fee', amount: weekly, type: 'weekly', date: 'Current week' },
    { label: 'E-ZPass Toll — I-495 N', amount: 4.75, type: 'toll', date: '5/18/2026', note: 'License plate match' },
    { label: 'E-ZPass Toll — I-95 S', amount: 3.25, type: 'toll', date: '5/20/2026', note: 'License plate match' },
    { label: 'Parking Ticket — DC DMV', amount: 75.00, type: 'ticket', date: '5/15/2026', note: 'No standing zone' },
    { label: 'Late Fee — Prior Week', amount: 25.00, type: 'late', date: '5/14/2026' },
  ];

  const currentBalance = lineItems.reduce((sum, i) => sum + i.amount, 0);

  const pastInvoices: PastInvoice[] = [
    { id: 'INV-2026-0021', period: 'May 7 – May 13, 2026', total: weekly, paid: true, date: '5/13/2026' },
    { id: 'INV-2026-0018', period: 'Apr 30 – May 6, 2026', total: weekly + 4.25, paid: true, date: '5/06/2026' },
    { id: 'INV-2026-0015', period: 'Apr 23 – Apr 29, 2026', total: weekly + 25, paid: true, date: '4/29/2026' },
    { id: 'INV-2026-0012', period: 'Apr 16 – Apr 22, 2026', total: weekly, paid: true, date: '4/22/2026' },
    { id: 'INV-2026-0009', period: 'Apr 9 – Apr 15, 2026', total: weekly + 75 + 3.50, paid: true, date: '4/15/2026' },
    { id: 'INV-2026-0006', period: 'Apr 2 – Apr 8, 2026', total: weekly, paid: true, date: '4/08/2026' },
  ];

  return { currentBalance, dueDate: dueDateStr, lineItems, pastInvoices };
}
