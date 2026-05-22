// ── WHIP PRINT OUTPUT BUILDER ────────────────────────────────────────────────
// Generates pixel-perfect print HTML for the Member Lease Agreement + add-on forms
// CRITICAL: PIP, GA UM, FL UM/UIM forms must NOT have any font/format changes

import { StateData, ACK_ITEMS } from './agreementData';

const LOGO = '/manus-storage/whip_logo_db5e4f39.png';
const COMPANY = 'Metrocars Leasing Corp. d/b/a Whip';
const ADDRESS = '14670 Southlawn Lane, Rockville MD 20850';

interface Fields {
  memberName?: string;
  dob?: string;
  phone?: string;
  email?: string;
  dlNumber?: string;
  licenseState?: string;
  address?: string;
  cityStateZip?: string;
  customerId?: string;
  reservationId?: string;
  vehicle?: string;
  vin?: string;
  weeklyFee?: string;
  deposit?: string;
  startDate?: string;
  endDate?: string;
  printedName?: string;
  dateSigned?: string;
}

export function buildPrintHTML(
  fields: Fields,
  stateData: StateData,
  sigDataURL: string | null,
  pipElection: 'full' | 'waive' | null
): string {
  const today = fields.dateSigned || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="height:52pt;max-width:100%;object-fit:contain;object-position:left bottom;">`
    : '';

  const mainPages = buildMainPages(fields, stateData, sigImg, today);
  const addonPages = buildAddonPages(fields, stateData, sigDataURL, pipElection, today);

  return `
<div id="print-output" style="display:none;">
  <style>
    /* ── PRINT BASE ── */
    #print-output {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      line-height: 1.38;
      color: #000;
      background: white;
    }

    /* ── PAGE STRUCTURE ── */
    .agr-page {
      width: 100%;
      page-break-after: always;
      padding-bottom: 14pt;
      position: relative;
    }
    .agr-page-last {
      page-break-after: auto;
    }

    /* ── HEADER ── */
    .agr-hdr {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 6pt;
      border-bottom: 1.5pt solid #171b31;
      margin-bottom: 6pt;
    }
    .agr-hdr-logo {
      height: 28pt;
      width: auto;
    }
    .agr-hdr-right {
      text-align: right;
      font-family: Arial, sans-serif;
      font-size: 7pt;
      color: #555;
      line-height: 1.4;
    }
    .agr-hdr-right-sub {
      font-family: Arial, sans-serif;
      font-size: 6.5pt;
      color: #888;
      text-align: right;
    }

    /* ── TITLE ── */
    .agr-title-block { margin: 5pt 0 4pt; }
    .agr-title-block h1 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 20pt;
      font-weight: bold;
      color: #000;
      margin: 0 0 2pt;
      line-height: 1.1;
    }
    .agr-subtitle {
      font-family: Arial, sans-serif;
      font-size: 7pt;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: #555;
    }

    /* ── FIELDS GRID ── */
    .agr-fields {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4pt;
      border: 0.75pt solid #000;
    }
    .agr-fields td {
      padding: 2pt 4pt;
      border: 0.75pt solid #000;
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      vertical-align: top;
      width: 50%;
    }
    .agr-fl {
      font-family: Arial, sans-serif;
      font-size: 5.5pt;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #555;
      display: block;
      margin-bottom: 1pt;
    }
    .agr-fv { font-size: 9pt; }

    /* ── SECTIONS ── */
    .agr-sec {
      margin-bottom: 0;
      padding-top: 3pt;
      border-top: 0.5pt solid #ccc;
    }
    .agr-sec-title {
      font-family: Arial, sans-serif;
      font-size: 6.5pt;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: #000;
      font-weight: bold;
      display: block;
      margin-bottom: 2pt;
      page-break-after: avoid;
    }
    .agr-sec p {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      line-height: 1.38;
      color: #000;
      text-align: justify;
      margin-bottom: 2pt;
      page-break-inside: avoid;
    }
    .agr-sec ul {
      padding-left: 13pt;
      margin: 2pt 0 0;
    }
    .agr-sec ul li {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      line-height: 1.36;
      color: #000;
      margin-bottom: 1.5pt;
    }
    .agr-stat-note {
      border-left: 2pt solid #171b31;
      padding: 3pt 6pt;
      margin: 3pt 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 8.5pt;
      font-style: italic;
      color: #333;
      background: #f8f8f8;
    }
    .agr-tos-line {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      color: #000;
      padding: 2pt 0 0;
      margin: 0;
      font-style: italic;
    }

    /* ── SIGNATURE BOX ── */
    .agr-sig-box {
      page-break-inside: avoid;
      border: 0.75pt solid #000;
      padding: 8pt 10pt;
      margin-top: 5pt;
    }
    .agr-sig-box h3 {
      font-family: Arial, sans-serif;
      font-size: 6.5pt;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: #000;
      font-weight: bold;
      margin-bottom: 5pt;
    }
    .agr-sig-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10pt;
      margin-top: 5pt;
    }
    .agr-sig-col-val {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      display: block;
      border-bottom: 0.5pt solid #000;
      min-height: 14pt;
      padding-bottom: 1pt;
    }
    .agr-sig-col-lbl {
      font-family: Arial, sans-serif;
      font-size: 5.5pt;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #555;
      display: block;
      margin-top: 2pt;
    }
    .agr-cert {
      font-family: 'Times New Roman', Times, serif;
      font-size: 8pt;
      line-height: 1.4;
      color: #333;
      margin-top: 6pt;
      font-style: italic;
    }
    .agr-rep-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12pt;
      margin-top: 10pt;
      padding-top: 6pt;
      border-top: 0.5pt solid #ccc;
    }
    .agr-rep-line {
      border-bottom: 0.75pt solid #000;
      min-height: 18pt;
      padding-bottom: 2pt;
    }
    .agr-rep-lbl {
      font-family: Arial, sans-serif;
      font-size: 5.5pt;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #555;
      display: block;
      margin-top: 2pt;
    }

    /* ── FOOTER ── */
    .agr-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 4pt 0.85in;
      border-top: 0.5pt solid #ccc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
    }
    .agr-footer span {
      font-family: Arial, sans-serif;
      font-size: 6.5pt;
      color: #888;
    }
    .agr-footer .afc {
      font-size: 6pt;
      color: #bbb;
      letter-spacing: .1em;
      text-transform: uppercase;
    }

    /* ── PIP FORM (PIXEL-PERFECT — DO NOT MODIFY) ── */
    @media screen {
      .pip-two-col { display: block; }
    }
    @media print {
      .pip-page {
        page-break-after: always;
        font-family: Arial, sans-serif;
        font-size: 10pt;
        line-height: 1.4;
        color: #000;
      }
      .pip-page-last { page-break-after: auto; }
      .pip-doc-title {
        font-family: Arial, sans-serif;
        font-size: 11pt;
        font-weight: bold;
        text-align: center !important;
        margin-bottom: 8pt;
        display: block;
      }
      .pip-two-col {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 16pt !important;
      }
      .pip-p2-col {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 12pt !important;
      }
      .pip-page p, .pip-page li {
        font-family: Arial, sans-serif !important;
        font-size: 10pt !important;
        line-height: 1.4 !important;
      }
      .pip-page h2 {
        font-family: Arial, sans-serif !important;
        font-size: 11pt !important;
        font-weight: bold !important;
        text-align: center !important;
      }
      .pip-sig-line {
        border-bottom: 1pt solid #000;
        min-height: 20pt;
        margin-bottom: 2pt;
        display: block;
      }
      .pip-sig-label {
        font-family: Arial, sans-serif !important;
        font-size: 8pt !important;
        color: #555;
      }

      /* WF (GA/FL) forms */
      .wf-page {
        page-break-after: always;
        font-family: Arial, sans-serif;
        font-size: 10pt;
        line-height: 1.4;
        color: #000;
      }
      .wf-page-last { page-break-after: auto; }
      .wf-page p, .wf-page li, .wf-page td, .wf-page th {
        font-family: Arial, sans-serif !important;
        font-size: 10pt !important;
        line-height: 1.4 !important;
      }
      .wf-page h2, .wf-page h3 {
        font-family: Arial, sans-serif !important;
        font-size: 11pt !important;
        font-weight: bold !important;
      }
    }
  </style>

  ${mainPages}
  ${addonPages}
</div>
`;
}

function buildMainPages(fields: Fields, sd: StateData, sigImg: string, today: string): string {
  const hdr1 = `
    <div class="agr-hdr">
      <img src="${LOGO}" class="agr-hdr-logo" alt="Whip" onerror="this.style.display='none'">
      <div class="agr-hdr-right">
        ${COMPANY}<br>
        ${ADDRESS}<br>
        855-861-9401 · drivewhip.com
      </div>
    </div>`;

  const hdrSub = (pg: number) => `
    <div class="agr-hdr">
      <img src="${LOGO}" class="agr-hdr-logo" alt="Whip" onerror="this.style.display='none'">
      <div class="agr-hdr-right-sub">Member Lease Agreement · ${sd.name} · Page ${pg}</div>
    </div>`;

  const footer = `
    <div class="agr-footer">
      <span>${COMPANY} · ${ADDRESS}</span>
      <span class="afc">Confidential — Member Copy</span>
      <span>Page <span class="agr-pg-num"></span></span>
    </div>`;

  return `
  <!-- PAGE 1 -->
  <div class="agr-page">
    ${hdr1}
    <div class="agr-title-block">
      <h1>Member Lease Agreement</h1>
      <div class="agr-subtitle">${COMPANY} — ${sd.name}</div>
    </div>

    <table class="agr-fields">
      <tr>
        <td><span class="agr-fl">Member Full Name</span><span class="agr-fv">${fields.memberName || ''}</span></td>
        <td><span class="agr-fl">Date of Birth</span><span class="agr-fv">${fields.dob || ''}</span></td>
      </tr>
      <tr>
        <td><span class="agr-fl">Phone</span><span class="agr-fv">${fields.phone || ''}</span></td>
        <td><span class="agr-fl">Email</span><span class="agr-fv">${fields.email || ''}</span></td>
      </tr>
      <tr>
        <td><span class="agr-fl">Driver's License Number</span><span class="agr-fv">${fields.dlNumber || ''}</span></td>
        <td><span class="agr-fl">License State</span><span class="agr-fv">${fields.licenseState || ''}</span></td>
      </tr>
      <tr>
        <td colspan="2"><span class="agr-fl">Address</span><span class="agr-fv">${fields.address || ''} ${fields.cityStateZip || ''}</span></td>
      </tr>
      <tr>
        <td><span class="agr-fl">Member / Customer ID</span><span class="agr-fv">${fields.customerId || ''}</span></td>
        <td><span class="agr-fl">Reservation ID</span><span class="agr-fv">${fields.reservationId || ''}</span></td>
      </tr>
      <tr>
        <td colspan="2"><span class="agr-fl">Vehicle</span><span class="agr-fv">${fields.vehicle || ''}</span></td>
      </tr>
      <tr>
        <td><span class="agr-fl">VIN</span><span class="agr-fv">${fields.vin || ''}</span></td>
        <td><span class="agr-fl">Weekly Membership Fee</span><span class="agr-fv">${fields.weeklyFee ? '$' + fields.weeklyFee : ''}</span></td>
      </tr>
      <tr>
        <td><span class="agr-fl">Initial Deposit</span><span class="agr-fv">${fields.deposit ? '$' + fields.deposit : ''}</span></td>
        <td><span class="agr-fl">Agreement Start Date</span><span class="agr-fv">${fields.startDate || ''}</span></td>
      </tr>
      <tr>
        <td><span class="agr-fl">Agreement End Date</span><span class="agr-fv">${fields.endDate || ''}</span></td>
        <td><span class="agr-fl">Agreement Date</span><span class="agr-fv">${today}</span></td>
      </tr>
    </table>

    <div class="agr-sec" style="padding-top:0;border-top:none;">
      <span class="agr-sec-title">Parties and Vehicle</span>
      <p>This Member Lease Agreement ("Agreement") is entered into between Metrocars Leasing Corp. d/b/a Whip ("Whip") and the Member identified above. Whip agrees to lease the vehicle identified above to the Member exclusively for use in connection with licensed Transportation Network Company (TNC) rideshare and delivery operations, subject to the terms set forth herein. The Terms of Service are incorporated into this Agreement by reference.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Term</span>
      <p>This Agreement commences on the start date identified above and continues for eighteen (18) months unless earlier terminated. Membership renews weekly until the vehicle is returned to Whip. The Member may terminate this Agreement at any time upon written notice to Whip. Whip may terminate this Agreement at any time for cause, including violation of this Agreement, failure to maintain active TNC platform status, nonpayment, or any conduct that places the vehicle or third parties at risk.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Protection Plan</span>
      <p>The Member's weekly lease payment includes the Protection Plan, under which Metrocars Leasing Corp. maintains physical damage coverage — comprehensive and collision — on the vehicle as the registered owner. In the event of damage to the vehicle during the Member's lease term, the Member is responsible for a Damage Fee representing the lesser of the actual cost of repair or $1,000.00 per occurrence. The Damage Fee is due and payable upon demand and may be charged to the payment method on file.</p>
      <p>The Protection Plan does not apply where damage results from intentional or reckless conduct, or where the vehicle is operated in violation of this Agreement or applicable law. Operation of the vehicle by an unauthorized driver is a material breach of this Agreement; the Member remains financially liable for resulting damage and membership may be terminated.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Liability Benefit</span>
      <p>${sd.liabilityNote}</p>
      ${sd.stateNote ? `<div class="agr-stat-note">${sd.stateNote}</div>` : ''}
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Authorized Operators</span>
      <p>The vehicle may only be operated by the Member identified in this Agreement. No other individual is authorized to operate the vehicle. Unauthorized operation is a material breach of this Agreement. Whip reserves the right to recover the vehicle at the Member's expense without prior notice if the vehicle is operated by an unauthorized individual, abandoned, or used in violation of this Agreement or law.</p>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="agr-page">
    ${hdrSub(2)}

    <div class="agr-sec" style="padding-top:0;border-top:none;">
      <span class="agr-sec-title">Accident Reporting</span>
      <p>The Member must report any accident, collision, theft, or damage to the vehicle to Whip within 24 hours of the incident. Failure to timely report may affect the Member's rights under the Protection Plan and constitutes a breach of this Agreement. The Member agrees to cooperate fully with Whip's claims investigation, including providing a recorded statement, submitting to examination under oath if requested, and executing any documents required to preserve Whip's rights of recovery.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Subrogation</span>
      <p>To the extent Whip makes any payment arising from a loss caused by a third party, the Member hereby assigns to Whip all rights of recovery against such third party. The Member agrees to cooperate with Whip's pursuit of any subrogation claim, including executing documents, providing information, and appearing as a witness as reasonably requested. The Member shall take no action that would impair Whip's subrogation rights.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Return of Vehicle</span>
      <p>Upon termination of this Agreement, the Member shall return the vehicle to Whip immediately in the same condition as received, ordinary wear and tear excepted. The Member is not entitled to a replacement or substitute vehicle during any period in which the leased vehicle is out of service. Whip reserves the right to recover the vehicle without notice in the event of abandonment or material breach.</p>
      ${sd.statDisclosure ? `<div class="agr-stat-note">${sd.statDisclosure}</div>` : ''}
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Dispute Resolution and Arbitration</span>
      <p>Any dispute, claim, or controversy arising out of or relating to this Agreement or the Member's use of the vehicle shall be resolved by binding arbitration in accordance with the arbitration provisions set forth in the Terms of Service. By signing this Agreement, the Member waives the right to a jury trial and to participate in any class action or representative proceeding. This arbitration provision is governed by the Federal Arbitration Act.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Governing Law</span>
      <p>This Agreement shall be governed by and construed in accordance with the laws of ${sd.govLaw}.</p>
      <p class="agr-tos-line">Member read and agreed to the Whip Terms of Service (drivewhip.com/terms-of-service) prior to execution.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Member Acknowledgments</span>
      <p>By signing below, I, the Member, acknowledge and agree to the following:</p>
      <ul>
        ${ACK_ITEMS.map(item => `<li>${item}</li>`).join('\n        ')}
      </ul>
    </div>
  </div>

  <!-- PAGE 3 — SIGNATURE -->
  <div class="agr-page agr-page-last">
    ${hdrSub(3)}

    <div class="agr-sig-box">
      <h3>Signature and Execution</h3>
      <div>${sigImg}</div>
      <div class="agr-sig-row">
        <div>
          <span class="agr-sig-col-val">${fields.printedName || fields.memberName || ''}</span>
          <span class="agr-sig-col-lbl">Member Printed Name</span>
        </div>
        <div>
          <span class="agr-sig-col-val">${today}</span>
          <span class="agr-sig-col-lbl">Date</span>
        </div>
      </div>
      <p class="agr-cert">I certify that I have read this Member Lease Agreement and the Whip Terms of Service in their entirety, that I understand and agree to all terms and conditions, and that this agreement is legally binding upon my execution. I further certify that all information provided herein is accurate and complete.</p>
      <div class="agr-rep-row">
        <div>
          <div class="agr-rep-line"></div>
          <span class="agr-rep-lbl">Whip Representative Signature</span>
        </div>
        <div>
          <div class="agr-rep-line"></div>
          <span class="agr-rep-lbl">Date</span>
        </div>
      </div>
    </div>
  </div>

  ${footer}
  `;
}

function buildAddonPages(
  fields: Fields,
  sd: StateData,
  sigDataURL: string | null,
  pipElection: 'full' | 'waive' | null,
  today: string
): string {
  let html = '';

  if (sd.addons.includes('md-pip')) {
    html += buildMdPipPages(fields, sigDataURL, pipElection, today);
  }
  if (sd.addons.includes('ga-um')) {
    html += buildGaUmPage(fields, sigDataURL, today);
  }
  if (sd.addons.includes('fl-um')) {
    html += buildFlUmPage(fields, sigDataURL, today);
  }
  if (sd.addons.includes('pa-pip')) {
    html += buildPaPipPage(fields, sigDataURL, today);
  }

  return html;
}

// ── MD PIP PAGES (pixel-perfect, no format changes) ──────────────────────────
function buildMdPipPages(
  fields: Fields,
  sigDataURL: string | null,
  pipElection: 'full' | 'waive' | null,
  today: string
): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="height:40pt;max-width:180pt;object-fit:contain;object-position:left bottom;">`
    : '';
  const optFull = pipElection === 'full' ? '☑' : '☐';
  const optWaive = pipElection === 'waive' ? '☑' : '☐';

  return `
  <!-- MD PIP NOTICE PAGE -->
  <div class="pip-page" style="page-break-before:always;">
    <h2 style="text-align:center;font-size:11pt;font-weight:bold;margin-bottom:8pt;">MARYLAND PERSONAL INJURY PROTECTION NOTICE</h2>
    <p style="text-align:center;font-size:10pt;margin-bottom:12pt;">Metrocars Leasing Corp. d/b/a Whip</p>

    <p>As a lessee of a motor vehicle registered in Maryland, you are entitled to elect Personal Injury Protection (PIP) coverage or to waive such coverage. This notice is provided pursuant to Maryland Insurance Article § 19-505.</p>

    <p><strong>What is PIP?</strong> Personal Injury Protection (PIP) is a type of no-fault insurance that pays for medical expenses and lost wages for you and your passengers regardless of who caused the accident. In Maryland, PIP coverage is available in the amount of $2,500 per person per accident.</p>

    <div class="pip-two-col" style="margin:12pt 0;">
      <div>
        <p><strong>Option 1 — Elect Full PIP Coverage</strong></p>
        <p>You may elect to receive PIP coverage of $2,500 per person per accident. If you elect this option, PIP coverage will apply to you and your passengers for bodily injury sustained in an accident involving the leased vehicle, regardless of fault.</p>
        <p>PIP coverage pays: (a) reasonable and necessary medical expenses; (b) 85% of lost wages up to the policy limit; and (c) essential services expenses.</p>
        <p>PIP coverage does not apply to: (a) injuries sustained while the vehicle is being used to carry passengers for hire on a TNC platform (Periods 1, 2, and 3); (b) injuries to persons who are not occupants of the vehicle; or (c) injuries resulting from intentional acts.</p>
      </div>
      <div>
        <p><strong>Option 2 — Waive PIP Coverage</strong></p>
        <p>You may affirmatively waive PIP coverage. If you waive PIP, neither you nor your passengers will have access to PIP benefits for injuries sustained in an accident involving the leased vehicle.</p>
        <p>Before waiving PIP, you should consider: (a) whether you have other health insurance that would cover accident-related medical expenses; (b) whether you have disability insurance that would replace lost wages; and (c) the financial risk of being injured in an accident without PIP coverage.</p>
        <p>Waiving PIP does not affect your right to pursue a liability claim against an at-fault driver.</p>
      </div>
    </div>

    <p><strong>Your Election:</strong> Please indicate your election below. Your election will remain in effect for the duration of your lease agreement unless you notify Whip in writing of a change.</p>

    <div class="pip-p2-col" style="margin:10pt 0;">
      <div style="border:1pt solid #000;padding:8pt;">
        <p>${optFull} <strong>I ELECT PIP COVERAGE</strong> in the amount of $2,500 per person per accident.</p>
      </div>
      <div style="border:1pt solid #000;padding:8pt;">
        <p>${optWaive} <strong>I AFFIRMATIVELY WAIVE PIP COVERAGE.</strong> I understand that neither I nor my passengers will have PIP benefits.</p>
      </div>
    </div>

    <p style="margin-top:12pt;"><strong>Member Signature:</strong></p>
    <div style="margin-top:4pt;">
      <div>${sigImg}</div>
      <div class="pip-p2-col" style="margin-top:4pt;">
        <div>
          <span class="pip-sig-line">${name}</span>
          <span class="pip-sig-label">Member Printed Name</span>
        </div>
        <div>
          <span class="pip-sig-line">${today}</span>
          <span class="pip-sig-label">Date</span>
        </div>
      </div>
    </div>
  </div>

  <!-- MD PIP WAIVER PAGE -->
  ${pipElection === 'waive' ? buildMdPipWaiverPage(fields, sigDataURL, today) : ''}
  `;
}

function buildMdPipWaiverPage(fields: Fields, sigDataURL: string | null, today: string): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="height:40pt;max-width:180pt;object-fit:contain;object-position:left bottom;">`
    : '';

  return `
  <div class="pip-page pip-page-last" style="page-break-before:always;">
    <h2 style="text-align:center;font-size:11pt;font-weight:bold;margin-bottom:4pt;">MARYLAND PERSONAL INJURY PROTECTION</h2>
    <h2 style="text-align:center;font-size:11pt;font-weight:bold;margin-bottom:8pt;">WAIVER FORM</h2>
    <p style="text-align:center;font-size:10pt;margin-bottom:12pt;">Metrocars Leasing Corp. d/b/a Whip</p>

    <p>I, the undersigned, having been fully informed of my right to elect Personal Injury Protection (PIP) coverage pursuant to Maryland Insurance Article § 19-505, hereby <strong>affirmatively waive</strong> PIP coverage under the vehicle lease agreement with Metrocars Leasing Corp. d/b/a Whip.</p>

    <p>I understand and acknowledge the following:</p>
    <ol>
      <li>PIP coverage would have provided up to $2,500 per person per accident for medical expenses and lost wages regardless of fault.</li>
      <li>By waiving PIP, I and my passengers will not have access to PIP benefits for injuries sustained in accidents involving the leased vehicle.</li>
      <li>This waiver does not affect my right to pursue a liability claim against an at-fault driver.</li>
      <li>I may rescind this waiver by providing written notice to Whip prior to any accident giving rise to a PIP claim.</li>
      <li>I have had sufficient opportunity to review this waiver and to ask questions before signing.</li>
    </ol>

    <div class="pip-p2-col" style="margin-top:16pt;">
      <div>
        <p><strong>Member:</strong></p>
        <div style="margin-top:8pt;">${sigImg}</div>
        <span class="pip-sig-line" style="margin-top:4pt;">${name}</span>
        <span class="pip-sig-label">Member Signature / Printed Name</span>
        <span class="pip-sig-line" style="margin-top:8pt;">${today}</span>
        <span class="pip-sig-label">Date</span>
      </div>
      <div>
        <p><strong>Whip Representative:</strong></p>
        <span class="pip-sig-line" style="margin-top:32pt;"></span>
        <span class="pip-sig-label">Representative Signature</span>
        <span class="pip-sig-line" style="margin-top:8pt;"></span>
        <span class="pip-sig-label">Printed Name / Title</span>
        <span class="pip-sig-line" style="margin-top:8pt;"></span>
        <span class="pip-sig-label">Date</span>
      </div>
    </div>
  </div>`;
}

// ── GA UM PAGE ────────────────────────────────────────────────────────────────
function buildGaUmPage(fields: Fields, sigDataURL: string | null, today: string): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="height:40pt;max-width:180pt;object-fit:contain;object-position:left bottom;">`
    : '';

  return `
  <div class="wf-page wf-page-last" style="page-break-before:always;">
    <h2 style="text-align:center;font-size:11pt;font-weight:bold;margin-bottom:4pt;">GEORGIA UNINSURED MOTORIST COVERAGE</h2>
    <h2 style="text-align:center;font-size:11pt;font-weight:bold;margin-bottom:8pt;">SELECTION / REJECTION FORM</h2>
    <p style="text-align:center;font-size:10pt;margin-bottom:12pt;">Metrocars Leasing Corp. d/b/a Whip</p>

    <p>Pursuant to O.C.G.A. § 33-7-11, you are entitled to select or reject Uninsured Motorist (UM) coverage. UM coverage protects you if you are injured by a driver who has no insurance or insufficient insurance to cover your damages.</p>

    <p><strong>Available UM Coverage Options:</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:8pt 0;">
      <tr style="background:#f0f0f0;">
        <th style="border:1pt solid #000;padding:4pt 6pt;text-align:left;font-size:9pt;">Option</th>
        <th style="border:1pt solid #000;padding:4pt 6pt;text-align:left;font-size:9pt;">Description</th>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">☑ Reject UM Coverage</td>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">I reject Uninsured Motorist coverage. I understand I will have no UM protection under this lease.</td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">☐ Select UM — Add-On</td>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">UM coverage stacks on top of the at-fault driver's liability coverage.</td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">☐ Select UM — Reduced</td>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">UM coverage is reduced by amounts paid by the at-fault driver's insurer.</td>
      </tr>
    </table>

    <p style="margin-top:10pt;"><strong>Member Acknowledgment:</strong> I have read and understand the UM coverage options described above. My selection is indicated above.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16pt;margin-top:14pt;">
      <div>
        <div>${sigImg}</div>
        <span style="border-bottom:1pt solid #000;display:block;min-height:18pt;margin-top:4pt;">${name}</span>
        <span style="font-size:8pt;color:#555;">Member Signature / Printed Name</span>
        <span style="border-bottom:1pt solid #000;display:block;min-height:14pt;margin-top:8pt;">${today}</span>
        <span style="font-size:8pt;color:#555;">Date</span>
      </div>
      <div>
        <span style="border-bottom:1pt solid #000;display:block;min-height:40pt;margin-top:4pt;"></span>
        <span style="font-size:8pt;color:#555;">Whip Representative Signature</span>
        <span style="border-bottom:1pt solid #000;display:block;min-height:14pt;margin-top:8pt;"></span>
        <span style="font-size:8pt;color:#555;">Date</span>
      </div>
    </div>
  </div>`;
}

// ── FL UM PAGE ────────────────────────────────────────────────────────────────
function buildFlUmPage(fields: Fields, sigDataURL: string | null, today: string): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="height:40pt;max-width:180pt;object-fit:contain;object-position:left bottom;">`
    : '';

  return `
  <div class="wf-page wf-page-last" style="page-break-before:always;">
    <h2 style="text-align:center;font-size:11pt;font-weight:bold;margin-bottom:4pt;">FLORIDA UNINSURED / UNDERINSURED MOTORIST COVERAGE</h2>
    <h2 style="text-align:center;font-size:11pt;font-weight:bold;margin-bottom:8pt;">SELECTION / REJECTION FORM</h2>
    <p style="text-align:center;font-size:10pt;margin-bottom:12pt;">Metrocars Leasing Corp. d/b/a Whip</p>

    <p>Pursuant to Florida Statutes § 627.727, you are entitled to select or reject Uninsured/Underinsured Motorist (UM/UIM) coverage. This form documents your election.</p>

    <p><strong>UM/UIM Coverage Election:</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:8pt 0;">
      <tr style="background:#f0f0f0;">
        <th style="border:1pt solid #000;padding:4pt 6pt;text-align:left;font-size:9pt;">Selection</th>
        <th style="border:1pt solid #000;padding:4pt 6pt;text-align:left;font-size:9pt;">Description</th>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">☑ Reject UM/UIM</td>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">I reject Uninsured/Underinsured Motorist coverage for this lease vehicle.</td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">☐ Select Stacked UM/UIM</td>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">UM/UIM coverage stacks on top of the at-fault driver's liability limits.</td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">☐ Select Non-Stacked UM/UIM</td>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">UM/UIM coverage is limited to the policy limits without stacking.</td>
      </tr>
    </table>

    <p style="margin-top:10pt;"><strong>Member Acknowledgment:</strong> I have been offered UM/UIM coverage and have made the selection indicated above. I understand that rejecting UM/UIM coverage means I will have no protection if injured by an uninsured or underinsured driver.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16pt;margin-top:14pt;">
      <div>
        <div>${sigImg}</div>
        <span style="border-bottom:1pt solid #000;display:block;min-height:18pt;margin-top:4pt;">${name}</span>
        <span style="font-size:8pt;color:#555;">Member Signature / Printed Name</span>
        <span style="border-bottom:1pt solid #000;display:block;min-height:14pt;margin-top:8pt;">${today}</span>
        <span style="font-size:8pt;color:#555;">Date</span>
      </div>
      <div>
        <span style="border-bottom:1pt solid #000;display:block;min-height:40pt;margin-top:4pt;"></span>
        <span style="font-size:8pt;color:#555;">Whip Representative Signature</span>
        <span style="border-bottom:1pt solid #000;display:block;min-height:14pt;margin-top:8pt;"></span>
        <span style="font-size:8pt;color:#555;">Date</span>
      </div>
    </div>
  </div>`;
}

// ── PA PIP PAGE ───────────────────────────────────────────────────────────────
function buildPaPipPage(fields: Fields, sigDataURL: string | null, today: string): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="height:40pt;max-width:180pt;object-fit:contain;object-position:left bottom;">`
    : '';

  return `
  <div class="wf-page wf-page-last" style="page-break-before:always;">
    <h2 style="text-align:center;font-size:11pt;font-weight:bold;margin-bottom:4pt;">PENNSYLVANIA FIRST PARTY MEDICAL BENEFITS</h2>
    <h2 style="text-align:center;font-size:11pt;font-weight:bold;margin-bottom:8pt;">AND UM/UIM COVERAGE ELECTION FORM</h2>
    <p style="text-align:center;font-size:10pt;margin-bottom:12pt;">Metrocars Leasing Corp. d/b/a Whip</p>

    <p>Pursuant to Pennsylvania's Motor Vehicle Financial Responsibility Law (75 Pa. C.S. § 1701 et seq.), you are entitled to elect or reject First Party Medical Benefits and Uninsured/Underinsured Motorist (UM/UIM) coverage.</p>

    <p><strong>First Party Medical Benefits:</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:6pt 0 10pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;width:50%;">☑ Reject First Party Medical Benefits</td>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;width:50%;">☐ Elect First Party Medical Benefits ($5,000 minimum)</td>
      </tr>
    </table>

    <p><strong>UM/UIM Coverage:</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:6pt 0 10pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;width:50%;">☑ Reject UM/UIM Coverage</td>
        <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;width:50%;">☐ Elect UM/UIM Coverage (equal to liability limits)</td>
      </tr>
    </table>

    <p><strong>Limited Tort Election:</strong> By signing below, Member elects the <strong>Limited Tort</strong> option, which limits the right to sue for pain and suffering damages except in cases of serious injury.</p>

    <p style="margin-top:10pt;"><strong>Member Acknowledgment:</strong> I have read and understand the coverage options above. My elections are indicated above. I understand the consequences of my elections.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16pt;margin-top:14pt;">
      <div>
        <div>${sigImg}</div>
        <span style="border-bottom:1pt solid #000;display:block;min-height:18pt;margin-top:4pt;">${name}</span>
        <span style="font-size:8pt;color:#555;">Member Signature / Printed Name</span>
        <span style="border-bottom:1pt solid #000;display:block;min-height:14pt;margin-top:8pt;">${today}</span>
        <span style="font-size:8pt;color:#555;">Date</span>
      </div>
      <div>
        <span style="border-bottom:1pt solid #000;display:block;min-height:40pt;margin-top:4pt;"></span>
        <span style="font-size:8pt;color:#555;">Whip Representative Signature</span>
        <span style="border-bottom:1pt solid #000;display:block;min-height:14pt;margin-top:8pt;"></span>
        <span style="font-size:8pt;color:#555;">Date</span>
      </div>
    </div>
  </div>`;
}
