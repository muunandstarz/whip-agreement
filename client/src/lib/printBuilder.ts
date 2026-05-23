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
      margin-bottom: 3pt;
      border: 0.75pt solid #000;
    }
    .agr-fields td {
      padding: 1.5pt 3pt;
      border: 0.75pt solid #000;
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      vertical-align: top;
      width: 50%;
    }
    .agr-fl {
      font-family: Arial, sans-serif;
      font-size: 5pt;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #555;
      display: block;
      margin-bottom: 0.5pt;
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

    /* ── PIP FORM (PIXEL-PERFECT — EXACT MATCH TO maryland_pip_waiver(1).html) ── */
    /* These styles are copied verbatim from the original legal document HTML. DO NOT MODIFY. */
    .pip-page {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.38;
      color: #000;
      page-break-after: always;
    }
    .pip-page-last { page-break-after: auto; }
    .pip-doc-title {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      line-height: 1.5;
      margin-bottom: 28pt;
    }
    .pip-two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 24pt;
      align-items: start;
    }
    .pip-page p {
      font-size: 10pt;
      line-height: 1.38;
      margin-bottom: 8pt;
    }
    .pip-page ol.num {
      margin: 0 0 8pt 20pt;
      padding: 0;
    }
    .pip-page ol.num > li {
      font-size: 10pt;
      line-height: 1.38;
      margin-bottom: 7pt;
      padding-left: 3pt;
    }
    .pip-page ol.alpha {
      list-style-type: lower-alpha;
      margin: 5pt 0 0 18pt;
      padding: 0;
    }
    .pip-page ol.alpha > li {
      font-size: 10pt;
      line-height: 1.38;
      margin-bottom: 5pt;
      padding-left: 3pt;
    }
    .pip-page p.dash {
      margin-bottom: 6pt;
      padding-left: 0;
    }
    .pip-option1-head {
      font-size: 10pt;
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 8pt;
    }
    .pip-dollar {
      font-weight: bold;
      text-decoration: underline;
    }
    /* Page 2 */
    .pip-p2-col {
      padding-top: 44pt;
    }
    .pip-waiver-head {
      font-size: 10pt;
      font-weight: bold;
      line-height: 1.38;
      margin-bottom: 14pt;
    }
    .pip-insurer-line {
      display: inline-block;
      min-width: 140pt;
      border-bottom: 1.2pt solid #000;
      vertical-align: bottom;
      padding: 0 3pt 1pt 3pt;
      font-weight: bold;
      line-height: 1.1;
    }
    .pip-option-wrap {
      margin-bottom: 16pt;
    }
    .pip-chk-row {
      display: flex;
      align-items: flex-start;
      gap: 8pt;
    }
    .pip-chk-box {
      width: 11pt;
      height: 11pt;
      margin-top: 2pt;
      flex-shrink: 0;
      border: 1pt solid #000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
    }
    .pip-chk-label-full {
      font-size: 10pt;
      font-weight: bold;
      text-decoration: underline;
      line-height: 1.38;
      flex: 1;
    }
    .pip-chk-label-waive {
      font-size: 10pt;
      font-weight: bold;
      text-decoration: underline;
      line-height: 1.38;
      flex: 1;
    }
    .pip-chk-continuation {
      font-size: 10pt;
      line-height: 1.38;
      margin-top: 3pt;
      margin-bottom: 0;
    }
    .pip-sig-block {
      margin-top: 30pt;
    }
    .pip-sig-row {
      margin-bottom: 16pt;
    }
    .pip-sig-input {
      display: block;
      width: 100%;
      border: none;
      border-bottom: 1.2pt solid #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      padding: 2pt 0 3pt 2pt;
      background: transparent;
      color: #000;
    }
    .pip-sig-label {
      font-size: 10pt;
      display: block;
      margin-top: 3pt;
    }
    .pip-date-policy {
      display: grid;
      grid-template-columns: 110pt 1fr;
      column-gap: 20pt;
      margin-bottom: 16pt;
    }
    .pip-field-col {
      display: flex;
      flex-direction: column;
    }
    .pip-static-val {
      display: block;
      border-bottom: 1.2pt solid #000;
      font-size: 10pt;
      padding: 2pt 0 3pt 2pt;
      font-family: Arial, Helvetica, sans-serif;
      background: transparent;
      color: #000;
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
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
    }
    .wf-page h2, .wf-page h3 {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      font-weight: bold;
    }
  </style>

  ${mainPages}
  ${addonPages}
</div>
`;
}

export function buildAddonOnlyHTML(
  addonKey: string,
  fields: Fields,
  stateData: StateData,
  sigDataURL: string | null,
  pipElection: 'full' | 'waive' | null
): string {
  const today = fields.dateSigned || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Build only the requested addon
  const singleAddon: StateData = { ...stateData, addons: [addonKey as StateData['addons'][number]] };
  const addonPages = buildAddonPages(fields, singleAddon, sigDataURL, pipElection, today);

  // Reuse the same CSS block so forms render identically
  const cssStart = `<div id="print-output" style="display:none;">`;
  const cssEnd = `</div>`;

  return `
${cssStart}
  <style>
    /* ── PRINT BASE ── */
    #print-output {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      line-height: 1.38;
      color: #000;
      background: white;
    }
    .agr-page { width: 100%; page-break-after: always; padding-bottom: 14pt; position: relative; }
    .agr-page-last { page-break-after: auto; }
    @media print {
      @page { margin: 0.65in 0.65in 0.65in 0.65in; }
      #print-output { display: block !important; }
      body > *:not(#print-output) { display: none !important; }
    }
  </style>
  ${addonPages}
${cssEnd}
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
      <div class="agr-hdr-right-sub">Member Lease Agreement${sd.code !== 'OTHER' ? ' · ' + sd.name : ''} · Page ${pg}</div>
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
      <p>The Member must report any accident, collision, theft, or damage to the vehicle to Whip within 24 hours of the incident. To file a claim, visit <strong>drivewhip.com</strong> and click "File a Claim." Failure to timely report may affect the Member's rights under the Protection Plan and constitutes a breach of this Agreement. The Member agrees to cooperate fully with Whip's claims investigation, including providing a recorded statement, submitting to examination under oath if requested, and executing any documents required to preserve Whip's rights of recovery.</p>
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

// ── MD PIP PAGES (PIXEL-PERFECT — EXACT MATCH TO maryland_pip_waiver(1).html) ────────────────
// HTML structure, CSS classes, and text are copied verbatim from the original legal document.
// Only dynamic values are substituted: member name, signature image, date, and checkbox state.
// DO NOT change fonts, layout, spacing, or text content.
function buildMdPipPages(
  fields: Fields,
  sigDataURL: string | null,
  pipElection: 'full' | 'waive' | null,
  today: string
): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="height:40pt;max-width:180pt;object-fit:contain;object-position:left bottom;display:block;">`
    : '';
  // Checkbox rendering: checked = &#9745; (☑), unchecked = &#9744; (☐)
  const chkFull  = pipElection === 'full'  ? '&#9745;' : '&#9744;';
  const chkWaive = pipElection === 'waive' ? '&#9745;' : '&#9744;';

  return `
  <!-- MD PIP PAGE 1 — NOTICE (2-column, exact match to maryland_pip_waiver(1).html) -->
  <div class="pip-page" style="page-break-before:always; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.38; color: #000; padding: 0.75in 0.8in;">

    <div style="text-align:center; font-size:13pt; font-weight:bold; line-height:1.5; margin-bottom:28pt;">
      Notice and Waiver of<br>
      Personal Injury Protection (PIP) Coverage
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; column-gap:24pt; align-items:start;">

      <!-- LEFT COLUMN -->
      <div>
        <p style="margin-bottom:10pt;">
          <strong><u>Notice Concerning the Waiver of<br>
          Personal Injury Protection (PIP)<br>
          Coverage in Maryland</u></strong> (Private Passenger<br>
          Automobile Liability Insurance)
        </p>

        <p style="margin-bottom:8pt;">You have the choice of purchasing certain Personal Injury Protection (PIP) Coverages. Before deciding whether to purchase or waive this coverage, please read the following carefully.</p>

        <p style="font-size:10pt; font-weight:bold; text-decoration:underline; margin-bottom:8pt;">OPTION 1 - FULL PIP</p>

        <p style="margin-bottom:8pt;"><strong>Full</strong> PIP coverage provides the following protection, without regard to fault::</p>

        <ol style="margin:0 0 8pt 20pt; padding:0;">
          <li style="font-size:10pt; line-height:1.38; margin-bottom:7pt; padding-left:3pt;">It covers you and members of your family&nbsp;residing with you who are injured in
            <strong>any</strong>&nbsp;motor vehicle accident; anyone injured while <strong>in</strong>
            your vehicle; and pedestrians injured <strong>by</strong>&nbsp;your vehicle.
          </li>
          <li style="font-size:10pt; line-height:1.38; margin-bottom:7pt; padding-left:3pt;">The <strong>minimum</strong> coverage is $2,500 (<em>you may&nbsp;purchase more*</em>)
            and may be used to cover:
            <ol style="list-style-type:lower-alpha; margin:5pt 0 0 18pt; padding:0;">
              <li style="font-size:10pt; line-height:1.38; margin-bottom:5pt; padding-left:3pt;">All reasonable and necessary medical&nbsp;expenses incurred within 3 years of&nbsp;injury; and</li>
              <li style="font-size:10pt; line-height:1.38; margin-bottom:5pt; padding-left:3pt;">85 percent of actually incurred lost wages; or</li>
              <li style="font-size:10pt; line-height:1.38; margin-bottom:5pt; padding-left:3pt;">If the injured person is not employed at&nbsp;the time of injury, any reasonable and
                  necessary expenses to provide for essential services which that person&nbsp;would have
                  provided for the care and maintenance of his or her family or household.</li>
            </ol>
          </li>
        </ol>

        <p style="margin-bottom:8pt;">If you do <strong>not</strong> sign the waiver, you will automatically receive the full PIP
        protection described above. Your PIP premium will be
        <strong><u>$2,400</u></strong> (<strong><em>annually - Charged at $50/week</em></strong>).</p>
      </div>

      <!-- RIGHT COLUMN -->
      <div>
        <p style="margin-bottom:8pt;">You may only waive PIP coverage for:</p>

        <ol style="margin:0 0 8pt 20pt; padding:0;">
          <li style="font-size:10pt; line-height:1.38; margin-bottom:7pt; padding-left:3pt;">The <strong>named</strong> insured (you);</li>
          <li style="font-size:10pt; line-height:1.38; margin-bottom:7pt; padding-left:3pt;">All listed drivers on the policy; and</li>
          <li style="font-size:10pt; line-height:1.38; margin-bottom:7pt; padding-left:3pt;">Members of your family who are 16 years of age or older and reside with you in your household.</li>
        </ol>

        <p style="margin-bottom:8pt;">The waiver prevents the <strong>named</strong> insured (you) from collecting PIP benefits under
        <strong>any</strong> motor vehicle liability insurance policy issued in the State of Maryland or another
        form of security authorized to be used in place of a motor vehicle liability insurance policy.</p>

        <p style="margin-bottom:8pt;">The waiver prevents individuals described in category 2 or 3 above from collecting PIP benefits
        under your policy. In addition, if these individuals are involved in a motor vehicle accident, the
        waiver prevents these individuals from collecting PIP benefits under any other policy of motor vehicle
        liability insurance issued in the state of Maryland or another form of security authorized to be used
        in place of a motor vehicle liability insurance policy unless the individual:</p>

        <p style="margin-bottom:6pt;">- Is the first named insured under the other policy;</p>
        <p style="margin-bottom:6pt;">- Has not waived PIP benefits under the other policy; and</p>
        <p style="margin-bottom:8pt;">- Is not a named insured under any policy of&nbsp;motor vehicle liability&nbsp;
        insurance where a waiver of PIP benefits is in effect.</p>

        <p style="margin-bottom:8pt;">The waiver does not impair the rights of other individuals such as pedestrians or minor children
        from collecting PIP under your policy.</p>

        <p style="margin-bottom:8pt;">If you decide to sign the waiver, your PIP premium will be <u>0</u> percent of the full PIP
        coverage. The total premium will be $ <u>0.00</u> (<em>annually</em>).</p>

        <p style="margin-bottom:8pt;">If you decide <strong>not</strong> to sign the waiver, your insurance company may not refuse to
        write your insurance coverage.</p>
      </div>

    </div><!-- /two-col page 1 -->

  </div><!-- /pip page 1 -->

  <!-- MD PIP PAGE 2 — WAIVER (2-column, exact match to maryland_pip_waiver(1).html) -->
  <div class="pip-page pip-page-last" style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.38; color: #000; padding: 0.75in 0.8in;">

    <div style="display:grid; grid-template-columns:1fr 1fr; column-gap:24pt; align-items:start;">

      <!-- LEFT COLUMN — Waiver Body -->
      <div style="padding-top:44pt;">
        <p style="font-size:10pt; font-weight:bold; line-height:1.38; margin-bottom:14pt;">
          <u>Waiver of Personal Injury Protection<br>
          (PIP) Coverage</u> (Private Passenger<br>
          Automobile Liability Insurance)
        </p>

        <p style="margin-bottom:14pt;">I hereby confirm that I have fully read and
        understood the attached notice, required by Section 19-506 of the Insurance Article, and I
        understand and agree that</p>

        <p style="margin-bottom:8pt;"><span style="display:inline-block; min-width:140pt; border-bottom:1.2pt solid #000; vertical-align:bottom; padding:0 3pt 1pt 3pt; font-weight:bold; line-height:1.1;">Metrocars Leasing</span>, in reliance upon
        my signature as&nbsp;the first named insured/applicant, will NOT&nbsp;provide the
        Personal Injury Protection (PIP) Coverage, required by Section&nbsp;19-505 and described in
        the attached notice&nbsp;provided to me with this waiver. This&nbsp;coverage is waived for any
        injury which may&nbsp;be sustained by:</p>

        <p style="margin-bottom:8pt;"><strong>1. Anyone listed as a named insured on the policy;</strong></p>
        <p style="margin-bottom:8pt;"><strong>2. All drivers listed on the policy; and</strong></p>
        <p style="margin-bottom:8pt;"><strong>3. All members of the named insured's family living in the insured's household
        who are 16 years of age or older.</strong></p>

        <p style="margin-bottom:8pt;">I further understand and agree that the waiver of Personal Injury Protection (PIP) benefits
        under the policy being applied for waives coverage for PIP benefits
        <u>for anyone described above</u> under any other
        policy&nbsp;issued in the State of Maryland or another&nbsp;form of security authorized to be
        used in&nbsp;place of a motor vehicle liability insurance&nbsp;policy, unless the individual is:</p>

        <p style="margin-bottom:6pt;">-&nbsp;Is the first named insured under<br>&nbsp;&nbsp;the other policy; and</p>
        <p style="margin-bottom:6pt;">-&nbsp;Has not waived PIP benefits<br>&nbsp;&nbsp;under the other policy; and</p>
        <p style="margin-bottom:8pt;">- Is not a named insured under any&nbsp;&nbsp;policy of motor vehicle liability
        insurance where a waiver of PIP&nbsp;&nbsp;benefits is in effect.</p>

        <p style="margin-bottom:8pt;">I, the first named insured/applicant, have&nbsp;fully read and understood the above noted
        information and hereby: <strong><em>(check one of the following)</em></strong></p>
      </div>

      <!-- RIGHT COLUMN — Checkboxes + Signature -->
      <div style="padding-top:44pt;">

        <!-- OPTION 1: Request Full PIP -->
        <div style="margin-bottom:16pt;">
          <div style="display:flex; align-items:flex-start; gap:8pt;">
            <div style="width:11pt; height:11pt; margin-top:2pt; flex-shrink:0; border:1pt solid #000; display:inline-flex; align-items:center; justify-content:center; font-size:9pt;">${chkFull}</div>
            <span style="font-size:10pt; font-weight:bold; text-decoration:underline; line-height:1.38; flex:1;">
              request full PIP coverage be applicable to the
              policy or binder of insurance described
              <u>below,</u> on all future renewals of the policy
              and on&nbsp;all replacement policies unless I notify the
              company in writing to the&nbsp;contrary, with the effective date of&nbsp;
              such change being no earlier than&nbsp;the receipt date by the company of&nbsp;
              my written notification.
            </span>
          </div>
        </div>

        <!-- OPTION 2: Affirmatively Waive -->
        <div style="margin-bottom:16pt;">
          <div style="display:flex; align-items:flex-start; gap:8pt;">
            <div style="width:11pt; height:11pt; margin-top:2pt; flex-shrink:0; border:1pt solid #000; display:inline-flex; align-items:center; justify-content:center; font-size:9pt;">${chkWaive}</div>
            <span style="font-size:10pt; font-weight:bold; text-decoration:underline; line-height:1.38; flex:1;">
              affirmatively waive the benefits required by Section 19-505 of the
            </span>
          </div>
          <p style="font-size:10pt; line-height:1.38; margin-top:3pt; margin-bottom:0;">
            <u><strong>Insurance Article (PIP).</strong></u> I understand and
            agree that this waiver of coverage shall be applicable to the policy or binder of
            insurance described below, on all future renewals of the policy and on all
            replacement policies unless I notify the company in writing to the contrary, with the
            effective date of&nbsp;such change being no earlier&nbsp;than the receipt date by the
            company of&nbsp;my written notification.
          </p>
        </div>

        <!-- SIGNATURE BLOCK -->
        <div style="margin-top:30pt;">

          <!-- First Named Insured/Applicant -->
          <div style="margin-bottom:16pt;">
            <div style="display:block; width:100%; border-bottom:1.2pt solid #000; font-size:10pt; padding:2pt 0 3pt 2pt; font-family:Arial,Helvetica,sans-serif; background:transparent; color:#000;">${name}</div>
            <span style="font-size:10pt; display:block; margin-top:3pt;">First Named Insured/Applicant</span>
          </div>

          <!-- Signature -->
          <div style="margin-bottom:16pt;">
            <div style="display:block; width:100%; border-bottom:1.2pt solid #000; min-height:44pt; padding:2pt 0 3pt 2pt; background:transparent;">${sigImg}</div>
            <span style="font-size:10pt; display:block; margin-top:3pt;">Signature of First Named Insured/Applicant</span>
          </div>

          <!-- Date + Policy/Binder # -->
          <div style="display:grid; grid-template-columns:110pt 1fr; column-gap:20pt; margin-bottom:16pt;">
            <div style="display:flex; flex-direction:column;">
              <span style="display:block; border-bottom:1.2pt solid #000; font-size:10pt; padding:2pt 0 3pt 2pt; font-family:Arial,Helvetica,sans-serif; background:transparent; color:#000;">${today}</span>
              <span style="font-size:10pt; display:block; margin-top:3pt;">Date</span>
            </div>
            <div style="display:flex; flex-direction:column;">
              <span style="display:block; border-bottom:1.2pt solid #000; font-size:10pt; padding:2pt 0 3pt 2pt; font-family:Arial,Helvetica,sans-serif; background:transparent; color:#000;">S0137</span>
              <span style="font-size:10pt; display:block; margin-top:3pt;">Policy/Binder #</span>
            </div>
          </div>

          <!-- Insurer -->
          <div style="margin-bottom:16pt;">
            <span style="display:block; width:100%; border-bottom:1.2pt solid #000; font-size:10pt; padding:2pt 0 3pt 2pt; font-family:Arial,Helvetica,sans-serif; background:transparent; color:#000;">Metrocars Leasing</span>
            <span style="font-size:10pt; display:block; margin-top:3pt;">Insurer</span>
          </div>

        </div><!-- /sig-block -->

      </div><!-- /right col -->

    </div><!-- /two-col page 2 -->

  </div><!-- /pip page 2 -->
  `;
}

// ── GA UM PAGE (EXACT MATCH TO GARejectionForms.pdf) ─────────────────────────
function buildGaUmPage(fields: Fields, sigDataURL: string | null, today: string): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="max-height:36pt;max-width:100%;object-fit:contain;object-position:left bottom;display:block;">`
    : '';

  return `
  <div class="wf-page wf-page-last" style="page-break-before:always;font-family:Arial,Helvetica,sans-serif;font-size:10pt;line-height:1.4;color:#000;">

    <!-- Title box -->
    <div style="border:1.5pt solid #000;padding:10pt 14pt;text-align:center;margin-bottom:14pt;">
      <strong style="font-size:11pt;">GEORGIA UNINSURED MOTORIST COVERAGE SELECTION /<br>REJECTION FORM</strong>
    </div>

    <!-- Policy / Applicant info table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;">
          <strong style="font-size:8pt;">POLICY NUMBER:</strong><br>
          S0137
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;">
          <strong style="font-size:8pt;">POLICY EFFECTIVE DATE:</strong><br>
          &nbsp;
        </td>
      </tr>
      <tr>
        <td colspan="2" style="border:1pt solid #000;padding:4pt 6pt;">
          <strong style="font-size:8pt;">APPLICANT / NAMED INSURED:</strong><br>
          ${name}
        </td>
      </tr>
    </table>

    <!-- Notice heading -->
    <p style="text-align:center;font-weight:bold;margin-bottom:10pt;">Notice to Named Insured — Required Under O.C.G.A. § 33-7-11</p>

    <p><strong>Georgia law requires every motor vehicle liability policy issued in this state to include Uninsured Motorist (UM) coverage at limits equal to the policy's bodily injury and property damage liability limits — UNLESS the named insured rejects UM coverage in writing or selects lower limits in writing.</strong></p>

    <p>Uninsured Motorist coverage protects you and other persons covered under the policy against bodily injury and property damage caused by the negligence of an owner or operator of an uninsured motor vehicle. Under Georgia law, an "uninsured motor vehicle" includes a vehicle whose liability limits are less than the damages sustained by the injured person — meaning UM coverage in Georgia also functions as Underinsured Motorist coverage.</p>

    <p>Georgia offers UM in two forms:</p>
    <p style="margin-left:24pt;margin-bottom:6pt;">(1) Traditional / Reduced-by Coverage: UM benefits are reduced by the amount the at-fault driver's insurance pays.</p>
    <p style="margin-left:24pt;margin-bottom:14pt;">(2) Add-on / Excess Coverage: UM benefits are paid in addition to the at-fault driver's liability insurance, up to the UM limits.</p>

    <!-- SELECTION heading -->
    <p style="font-weight:bold;text-decoration:underline;font-size:11pt;margin-bottom:8pt;">SELECTION</p>

    <p><strong>I have read the notice above. I understand that my election applies to all persons covered under the policy and continues on all renewal, reinstatement, replacement, and substitute policies, unless I notify the company in writing of a change. I select ONE of the following:</strong></p>

    <!-- Four options -->
    <p style="margin-bottom:10pt;">&#9744; <strong>OPTION 1 — UM AT POLICY LIABILITY LIMITS (TRADITIONAL).</strong> I elect Traditional UM coverage at limits equal to my bodily injury and property damage liability limits.</p>

    <p style="margin-bottom:10pt;">&#9744; <strong>OPTION 2 — UM AT POLICY LIABILITY LIMITS (ADD-ON).</strong> I elect Add-on UM coverage at limits equal to my bodily injury and property damage liability limits.</p>

    <p style="margin-bottom:10pt;">&#9744; <strong>OPTION 3 — UM AT LOWER LIMITS.</strong> I elect UM coverage at limits lower than my bodily injury and property damage liability limits, but not less than the statutory minimum of $25,000 per person / $50,000 per accident bodily injury and $25,000 property damage.</p>

    <p style="margin-bottom:14pt;">&#9745; <strong>OPTION 4 — REJECTION OF UM COVERAGE.</strong> I REJECT Uninsured Motorist coverage in its entirety. I understand that by rejecting this coverage, no person covered under this policy will have UM protection for injuries or property damage caused by an uninsured or underinsured driver.</p>

    <p><strong>I understand that if I do not sign this form, my policy will include Uninsured Motorist coverage at limits equal to my bodily injury and property damage liability limits, and I will be charged the corresponding premium.</strong></p>

    <!-- SIGNATURES heading -->
    <p style="font-weight:bold;text-decoration:underline;font-size:11pt;margin-top:14pt;margin-bottom:8pt;">SIGNATURES</p>

    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;min-height:44pt;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">APPLICANT SIGNATURE</div>
          <div style="min-height:36pt;">${sigImg}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:28%;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">PRINTED NAME</div>
          <div style="min-height:36pt;">${name}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:22%;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">DATE</div>
          <div style="min-height:36pt;">${today}</div>
        </td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">PRODUCER NAME (PRINTED)</div>
          <div style="min-height:36pt;">Metrocars Leasing Corp. d/b/a Whip</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">PRODUCER SIGNATURE</div>
          <div style="min-height:36pt;"></div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">DATE</div>
          <div style="min-height:36pt;"></div>
        </td>
      </tr>
    </table>

    <p style="font-style:italic;font-size:8.5pt;text-align:center;margin-top:10pt;">This form is provided pursuant to O.C.G.A. § 33-7-11 and is intended to satisfy the written rejection / selection requirement of that section.</p>

  </div>`;
}

// ── FL UM PAGE (EXACT MATCH TO FLRejectionForms.pdf) ─────────────────────────
function buildFlUmPage(fields: Fields, sigDataURL: string | null, today: string): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="max-height:36pt;max-width:100%;object-fit:contain;object-position:left bottom;display:block;">`
    : '';

  return `
  <div class="wf-page wf-page-last" style="page-break-before:always;font-family:Arial,Helvetica,sans-serif;font-size:10pt;line-height:1.4;color:#000;">

    <!-- Title box -->
    <div style="border:1.5pt solid #000;padding:10pt 14pt;text-align:center;margin-bottom:14pt;">
      <strong style="font-size:11pt;">FLORIDA UNINSURED / UNDERINSURED MOTORIST COVERAGE<br>SELECTION / REJECTION FORM</strong>
    </div>

    <!-- Policy / Applicant info table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;">
          <strong style="font-size:8pt;">POLICY NUMBER:</strong><br>
          S0137
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;">
          <strong style="font-size:8pt;">POLICY EFFECTIVE DATE:</strong><br>
          &nbsp;
        </td>
      </tr>
      <tr>
        <td colspan="2" style="border:1pt solid #000;padding:4pt 6pt;">
          <strong style="font-size:8pt;">APPLICANT / NAMED INSURED:</strong><br>
          ${name}
        </td>
      </tr>
    </table>

    <!-- Notice heading -->
    <p style="text-align:center;font-weight:bold;margin-bottom:10pt;">Notice to Named Insured — Required Under § 627.727, Florida Statutes</p>

    <p><strong>Florida law requires every motor vehicle liability policy issued in this state to include Uninsured Motorist (UM) bodily injury coverage at limits equal to the policy's bodily injury liability limits — UNLESS the named insured selects lower limits or rejects UM coverage in writing on this approved form.</strong></p>

    <p>Uninsured Motorist coverage protects you, members of your family residing with you, and other persons covered under the policy from bodily injury, sickness, disease, or death caused by the negligence of the owner or operator of an uninsured motor vehicle, including a hit-and-run vehicle and a vehicle whose insurer becomes insolvent. It also includes Underinsured Motorist (UIM) protection — coverage for situations in which the at-fault driver's liability limits are insufficient to fully compensate you for your damages.</p>

    <p>Your policy's bodily injury liability limits are the Florida statutory minimums required under § 324.021(7), Florida Statutes.</p>

    <p><strong>The premium for UM coverage at full limits, the premium for UM coverage at lower limits, and the premium savings for rejecting UM coverage will be disclosed on your declarations or coverage disclosure document.</strong></p>

    <!-- SELECTION heading -->
    <p style="font-weight:bold;text-decoration:underline;font-size:11pt;margin-top:12pt;margin-bottom:8pt;">SELECTION</p>

    <p><strong>I have read the notice above and make the following election. I understand that my election applies to me, all relatives residing in my household, and all persons covered under the policy. I understand that this election applies to the policy described above and to all renewals and replacement policies, unless I notify the company in writing of a change.</strong></p>

    <!-- Three options -->
    <p style="margin-bottom:10pt;">&#9744; <strong>OPTION 1 — UM AT FULL BODILY INJURY LIABILITY LIMITS.</strong> I elect Uninsured Motorist coverage at limits equal to my bodily injury liability limits.</p>

    <p style="margin-bottom:10pt;">&#9744; <strong>OPTION 2 — UM AT LOWER LIMITS.</strong> I elect Uninsured Motorist coverage at limits lower than my bodily injury liability limits. I understand that lower UM limits will reduce the amount available to me, my household relatives, and other covered persons in the event of injury caused by an uninsured or underinsured driver.</p>

    <p style="margin-bottom:10pt;">&#9745; <strong>OPTION 3 — REJECTION OF UM COVERAGE.</strong> I REJECT Uninsured Motorist coverage in its entirety. I understand that by rejecting this coverage, I, my household relatives, and other covered persons will have no protection under this policy for injuries caused by an uninsured or underinsured driver, including a hit-and-run driver.</p>

    <p><strong>I understand that if I do not sign this form, my policy will include Uninsured Motorist coverage at limits equal to my bodily injury liability limits, and I will be charged the corresponding premium. I further understand that this rejection or selection of lower limits will continue on all renewals, reinstatements, replacements, substitute, or amended policies issued by this insurer unless I request a change in writing.</strong></p>

    <!-- SIGNATURES heading -->
    <p style="font-weight:bold;text-decoration:underline;font-size:11pt;margin-top:14pt;margin-bottom:8pt;">SIGNATURES</p>

    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;min-height:44pt;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">APPLICANT SIGNATURE</div>
          <div style="min-height:36pt;">${sigImg}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:28%;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">PRINTED NAME</div>
          <div style="min-height:36pt;">${name}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:22%;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">DATE</div>
          <div style="min-height:36pt;">${today}</div>
        </td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">PRODUCER NAME (PRINTED)</div>
          <div style="min-height:36pt;">Metrocars Leasing Corp. d/b/a Whip</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">PRODUCER SIGNATURE</div>
          <div style="min-height:36pt;"></div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8pt;font-weight:bold;margin-bottom:2pt;">DATE</div>
          <div style="min-height:36pt;"></div>
        </td>
      </tr>
    </table>

    <p style="font-style:italic;font-size:8.5pt;text-align:center;margin-top:10pt;">This form is provided pursuant to § 627.727, Florida Statutes, and is intended to satisfy the written rejection / selection requirement of that section.</p>

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
