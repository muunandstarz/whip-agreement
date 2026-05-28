// ── WHIP PRINT OUTPUT BUILDER ────────────────────────────────────────────────
// Generates pixel-perfect print HTML matching the official Whip Member Agreement PDFs.
// CRITICAL: All text, layout, and structure must match the PDFs exactly.
// DO NOT change section text, order, or structure without updating the source PDFs.

import { StateData } from './agreementData';

const LOGO = '/manus-storage/whip_logo_db5e4f39.png';
const COMPANY = 'Metrocars Leasing Corp. d/b/a Whip';
const CONFIDENTIAL_FOOTER = `${COMPANY} — Confidential`;

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

// ── SHARED CSS ────────────────────────────────────────────────────────────────
const SHARED_CSS = `
  /* ── BASE ── */
  .agr-page {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #000;
    page-break-after: always;
    position: relative;
  }
  .agr-page-last { page-break-after: auto; }

  /* ── HEADER ── */
  .agr-hdr {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 6pt;
    border-bottom: 1.5pt solid #000;
    margin-bottom: 8pt;
  }
  .agr-hdr-logo { height: 28pt; width: auto; }
  .agr-hdr-right {
    text-align: right;
    font-size: 8pt;
    color: #333;
    line-height: 1.4;
  }

  /* ── TITLE ── */
  .agr-doc-title {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    margin: 0 0 6pt;
  }
  .agr-doc-intro {
    font-size: 9.5pt;
    line-height: 1.4;
    margin-bottom: 8pt;
  }

  /* ── FIELDS TABLE ── */
  .agr-fields {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8pt;
  }
  .agr-fields td {
    border: 0.75pt solid #000;
    padding: 3pt 5pt;
    font-size: 9.5pt;
    vertical-align: top;
  }
  .agr-fl {
    font-size: 7.5pt;
    font-weight: bold;
    display: block;
    margin-bottom: 1pt;
    color: #333;
  }
  .agr-fv { font-size: 9.5pt; display: block; min-height: 12pt; }

  /* ── TOS LINE ── */
  .agr-tos-row {
    font-size: 9.5pt;
    margin: 4pt 0 6pt;
  }
  .agr-tos-link { color: #000; text-decoration: underline; }

  /* ── SECTION HEADINGS ── */
  .agr-sec-title {
    font-size: 10pt;
    font-weight: bold;
    display: block;
    margin: 8pt 0 3pt;
  }
  .agr-sec p {
    font-size: 9.5pt;
    line-height: 1.4;
    margin: 0 0 4pt;
  }

  /* ── ACK LIST ── */
  .agr-ack-intro {
    font-size: 9.5pt;
    line-height: 1.4;
    margin: 4pt 0 3pt;
  }
  .agr-ack-list {
    margin: 0;
    padding-left: 16pt;
  }
  .agr-ack-list li {
    font-size: 9.5pt;
    line-height: 1.4;
    margin-bottom: 3pt;
  }

  /* ── SIGNATURE PAGE ── */
  .agr-sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12pt;
    margin-top: 12pt;
  }
  .agr-sig-field { }
  .agr-sig-line {
    display: block;
    border-bottom: 0.75pt solid #000;
    min-height: 40pt;
    padding-bottom: 2pt;
  }
  .agr-sig-label {
    font-size: 8.5pt;
    display: block;
    margin-top: 3pt;
    color: #000;
  }

  /* ── PAGE FOOTER ── */
  .agr-page-footer {
    position: absolute;
    bottom: 0.5in;
    left: 0.65in;
    right: 0.65in;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #333;
    border-top: 0.5pt solid #ccc;
    padding-top: 3pt;
  }

  /* ── ADDENDUM BLOCK ── */
  .agr-addendum-intro {
    font-size: 9.5pt;
    font-style: italic;
    margin: 6pt 0 4pt;
  }
  .agr-addendum-state-title {
    font-size: 10pt;
    font-weight: bold;
    display: block;
    margin: 4pt 0 3pt;
  }
  .agr-addendum-p {
    font-size: 9.5pt;
    line-height: 1.4;
    margin: 0 0 4pt;
  }
  .agr-addendum-caps {
    font-size: 9.5pt;
    font-weight: bold;
    line-height: 1.4;
    margin: 0 0 4pt;
  }

  /* ── WF (GA/PA) ADDON FORMS ── */
  .wf-page {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #000;
    page-break-after: always;
  }
  .wf-page-last { page-break-after: auto; }

  /* ── PIP (MD) ADDON FORMS ── */
  .pip-page {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.38;
    color: #000;
    page-break-after: always;
  }
  .pip-page-last { page-break-after: auto; }
`;

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
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
    ${SHARED_CSS}
    @media print {
      @page { margin: 0.65in; }
      #print-output { display: block !important; }
      body > *:not(#print-output) { display: none !important; }
    }
  </style>
  ${mainPages}
  ${addonPages}
</div>
`;
}

export function buildViewerHTML(
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Whip Member Agreement — ${fields.memberName || 'Member'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #e5e7eb;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #000;
      padding: 24px 0;
    }
    #viewer-toolbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 44px;
      background: #171b31;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    #viewer-toolbar .toolbar-title {
      color: white;
      font-family: Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    #viewer-toolbar .toolbar-title span { color: #ff6221; }
    #viewer-toolbar button {
      background: #ff6221;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 7px 16px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    #viewer-toolbar button:hover { background: #e55519; }
    #doc-pages {
      margin-top: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding-bottom: 40px;
    }
    .agr-page, .pip-page, .wf-page {
      background: white;
      width: 8.5in;
      min-height: 11in;
      padding: 0.65in;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
      position: relative;
    }
    .agr-page-last, .pip-page-last, .wf-page-last { }
    @media print {
      body { background: white; padding: 0; }
      #viewer-toolbar { display: none; }
      #doc-pages { margin-top: 0; gap: 0; padding: 0; }
      .agr-page, .pip-page, .wf-page {
        box-shadow: none;
        width: 100%;
        min-height: auto;
        padding: 0.65in;
        page-break-after: always;
      }
      .agr-page-last, .pip-page-last, .wf-page-last { page-break-after: auto; }
    }
    @media (max-width: 900px) {
      .agr-page, .pip-page, .wf-page { width: 100%; min-height: auto; }
    }
    ${SHARED_CSS}
  </style>
</head>
<body>
  <div id="viewer-toolbar">
    <div class="toolbar-title"><span>whip</span> · Member Agreement</div>
    <button onclick="window.print()">&#128438; Print / Save PDF</button>
  </div>
  <div id="doc-pages">
    ${mainPages}
    ${addonPages}
  </div>
</body>
</html>`;
}

export function buildAddonOnlyHTML(
  addonKey: string,
  fields: Fields,
  stateData: StateData,
  sigDataURL: string | null,
  pipElection: 'full' | 'waive' | null
): string {
  const today = fields.dateSigned || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const singleAddon: StateData = { ...stateData, addons: [addonKey as StateData['addons'][number]] };
  const addonPages = buildAddonPages(fields, singleAddon, sigDataURL, pipElection, today);

  return `
<div id="print-output" style="display:none;">
  <style>
    ${SHARED_CSS}
    @media print {
      @page { margin: 0.65in; }
      #print-output { display: block !important; }
      body > *:not(#print-output) { display: none !important; }
    }
  </style>
  ${addonPages}
</div>
`;
}

// ── MAIN PAGES ────────────────────────────────────────────────────────────────
function buildMainPages(fields: Fields, sd: StateData, sigImg: string, today: string): string {
  const hdr = `
    <div class="agr-hdr">
      <img src="${LOGO}" class="agr-hdr-logo" alt="Whip" onerror="this.style.display='none'">
      <div class="agr-hdr-right">
        ${COMPANY}<br>
        14670 Southlawn Lane, Rockville MD 20850<br>
        855-861-9401 · drivewhip.com
      </div>
    </div>`;

  // Determine addendum block for page 1 (state-specific paragraphs after Membership Terms)
  const addendumBlock = buildPage1Addendum(sd);

  // Determine state-specific Return of Vehicle note
  const returnNote = buildReturnOfVehicleNote(sd);

  // Governing law text
  const govLawText = buildGoverningLawText(sd);

  // Page 1 footer
  const footer1 = `<div style="text-align:center;font-size:8pt;color:#333;margin-top:10pt;">${CONFIDENTIAL_FOOTER}<br>Page 1</div>`;
  const footer2 = `<div style="text-align:center;font-size:8pt;color:#333;margin-top:10pt;">${CONFIDENTIAL_FOOTER}<br>Page 2</div>`;
  const footer3 = `<div style="text-align:center;font-size:8pt;color:#333;margin-top:10pt;">${CONFIDENTIAL_FOOTER}<br>Page 3</div>`;

  // Parse vehicle field into make/model if possible
  const vehicleStr = fields.vehicle || '';

  // Weekly fee display
  const weeklyFeeDisplay = fields.weeklyFee ? `$${fields.weeklyFee}` : '$';
  const depositDisplay = fields.deposit ? `$${fields.deposit}` : '$';

  // Format dates for display
  const startDateDisplay = formatDateDisplay(fields.startDate);
  const endDateDisplay = formatDateDisplay(fields.endDate);

  return `
  <!-- PAGE 1 -->
  <div class="agr-page">
    ${hdr}

    <div class="agr-doc-title">VEHICLE MEMBERSHIP AGREEMENT</div>

    <p class="agr-doc-intro">This Vehicle Membership Agreement and the Terms of Service (collectively the "Agreement") between Metrocars Leasing Corp. d/b/a Whip ("Whip") and the individual listed below ("Member") sets out the rights and obligations of the parties regarding the membership and the vehicle listed below, including its equipment, tools, tires, accessories, and contents ("Vehicle").</p>

    <!-- Member info fields -->
    <table class="agr-fields">
      <tr>
        <td style="width:33%;"><span class="agr-fl">Member</span><span class="agr-fv">${fields.memberName || ''}</span></td>
        <td style="width:33%;"><span class="agr-fl">Phone</span><span class="agr-fv">${fields.phone || ''}</span></td>
        <td style="width:34%;"><span class="agr-fl">Email</span><span class="agr-fv">${fields.email || ''}</span></td>
      </tr>
      <tr>
        <td colspan="3"><span class="agr-fl">Address</span><span class="agr-fv">${fields.address || ''}${fields.cityStateZip ? ' ' + fields.cityStateZip : ''}</span></td>
      </tr>
    </table>

    <div class="agr-tos-row">Our Terms of Service can be reviewed here. <a class="agr-tos-link" href="https://drivewhip.com/terms-of-service">Click Here</a></div>
    <div style="font-size:9.5pt;margin-bottom:8pt;">&#9632; I agree to the Terms of Service.</div>

    <!-- Dates / Fees / IDs -->
    <table class="agr-fields">
      <tr>
        <td style="width:25%;"><span class="agr-fl">Start Date</span><span class="agr-fv">${startDateDisplay}</span></td>
        <td style="width:25%;"><span class="agr-fl">Agreement End Date (18 Months)</span><span class="agr-fv">${endDateDisplay}</span></td>
        <td style="width:25%;"><span class="agr-fl">Weekly Membership Fee*</span><span class="agr-fv">${weeklyFeeDisplay}</span></td>
        <td style="width:25%;"><span class="agr-fl">Initial Deposit</span><span class="agr-fv">${depositDisplay}</span></td>
      </tr>
      <tr>
        <td colspan="2"><span class="agr-fl">Reservation ID</span><span class="agr-fv">${fields.reservationId || ''}</span></td>
        <td colspan="2"><span class="agr-fl">Customer ID / Member ID</span><span class="agr-fv">${fields.customerId || ''}</span></td>
      </tr>
    </table>

    <!-- Vehicle -->
    <div style="font-size:9.5pt;font-weight:bold;margin:4pt 0 2pt;">Vehicle</div>
    <div style="font-size:8.5pt;font-style:italic;margin-bottom:4pt;">Vehicle may change during the Membership Term. Membership Agreement terms apply to all Whip vehicles.</div>
    <table class="agr-fields">
      <tr>
        <td style="width:25%;"><span class="agr-fl">Make</span><span class="agr-fv">${extractMake(vehicleStr)}</span></td>
        <td style="width:25%;"><span class="agr-fl">Model</span><span class="agr-fv">${extractModel(vehicleStr)}</span></td>
        <td style="width:25%;"><span class="agr-fl">VIN</span><span class="agr-fv">${fields.vin || ''}</span></td>
        <td style="width:25%;"><span class="agr-fl">License Plate</span><span class="agr-fv">&nbsp;</span></td>
      </tr>
    </table>

    <!-- Membership Terms section -->
    <div class="agr-sec">
      <span class="agr-sec-title">Membership Terms</span>
      <p>This Agreement commences on the Start Date stated below and continues for eighteen (18) months, renewing weekly until the Vehicle is in Whip's possession. Whip may terminate this Agreement at any time for cause, including violation of this Agreement, failure to maintain active TNC platform status, nonpayment, or any conduct placing the vehicle or third parties at risk. Member may be subject to legal action if Vehicle is not returned on or before the last paid-for date.</p>
    </div>

    ${footer1}
  </div>

  <!-- PAGE 2 -->
  <div class="agr-page">
    ${hdr}

    ${addendumBlock}

    <div class="agr-sec">
      <span class="agr-sec-title">Protection Plan</span>
      <p>The Member's weekly lease payment includes the Protection Plan, under which Metrocars Leasing Corp. maintains physical damage coverage — comprehensive and collision — on the vehicle as the registered owner. In the event of damage to the vehicle during the Member's lease term, the Member is responsible for a Damage Fee of up to $1,000 per occurrence (the lesser of actual repair cost or $1,000). The Damage Fee is due and payable upon demand and may be charged to the payment method on file. The Protection Plan does not apply where damage results from intentional or reckless conduct, or where the vehicle is operated in violation of this Agreement or applicable law. In such cases, the Member may be held responsible for the full cost of repair or replacement. Operation of the vehicle by an unauthorized driver is a material breach of this Agreement; the Member remains financially liable for resulting damage and membership may be terminated.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Liability Benefit</span>
      <p>${sd.liabilityNote}</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Authorized Operators</span>
      <p>The vehicle may only be operated by the Member identified in this Agreement. No other individual is authorized to operate the vehicle. Unauthorized operation is a material breach of this Agreement. Whip reserves the right to recover the vehicle at the Member's expense without prior notice if the vehicle is operated by an unauthorized individual, abandoned, or used in violation of this Agreement or law.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Accident Reporting</span>
      <p>The Member must report any accident, collision, theft, or damage to the vehicle to Whip within 24 hours of the incident. Failure to timely report may affect the Member's rights under the Protection Plan and constitutes a breach of this Agreement. The Member agrees to cooperate fully with Whip's claims investigation, including providing a recorded statement, submitting to examination under oath if requested, and executing any documents required to preserve Whip's rights of recovery.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Subrogation</span>
      <p>To the extent Whip makes any payment arising from a loss caused by a third party, the Member hereby assigns to Whip all rights of recovery against such third party. The Member agrees to cooperate with Whip's pursuit of any subrogation claim, including executing documents, providing information, and appearing as a witness as reasonably requested. The Member shall take no action that would impair Whip's subrogation rights.</p>
    </div>

    ${footer2}
  </div>

  <!-- PAGE 3 — SECTIONS CONT + ACK + SIGNATURE -->
  <div class="agr-page">
    ${hdr}

    <div class="agr-sec">
      <span class="agr-sec-title">Return of Vehicle</span>
      <p>Upon termination of this Agreement, the Member shall return the vehicle to Whip immediately in the same condition as received, ordinary wear and tear excepted. The Member is not entitled to a replacement or substitute vehicle during any period in which the leased vehicle is out of service. Whip reserves the right to recover the vehicle without notice in the event of abandonment or material breach.${returnNote}</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Dispute Resolution and Arbitration</span>
      <p>Any dispute, claim, or controversy arising out of or relating to this Agreement or the Member's use of the vehicle shall be resolved by binding arbitration in accordance with the arbitration provisions set forth in the Terms of Service. By signing this Agreement, the Member waives the right to a jury trial and to participate in any class action or representative proceeding. This arbitration provision is governed by the Federal Arbitration Act.</p>
    </div>

    <div class="agr-sec">
      <span class="agr-sec-title">Governing Law</span>
      <p>${govLawText}</p>
    </div>

    <p class="agr-ack-intro">By signing below, I, the Member, have read and agree to the terms of this legal document and the Terms of Service, which are incorporated by reference in this legal document. I further agree, without limitation:</p>
    <ul class="agr-ack-list">
      <li>To arrive punctually for all scheduled service appointments and to notify Whip in advance in the event of a delay or if rescheduling is necessary.</li>
      <li>To report any and all vehicle damage or accidents to Whip within 24 hours of occurrence.</li>
      <li>To cooperate fully with Whip's claims investigation process, including providing a recorded statement, submitting to examination under oath if requested, and executing any documents necessary to protect Whip's rights.</li>
      <li>To remain current on all recurring membership payments and to pay any additional invoices within 24 hours of receipt.</li>
      <li>Not to operate or transport the vehicle beyond a 150-mile radius from the original pickup location without prior written authorization from Whip.</li>
      <li>That Whip may charge the credit card or other payment method provided to Whip for all amounts owed under the Agreement.</li>
      <li>That Whip may re-initiate any payment charge that is dishonored or rejected.</li>
      <li>That the driver's license presented is currently valid and will remain valid and not suspended, expired, revoked, cancelled or surrendered, until the vehicle is returned to Whip.</li>
      <li>To allow Whip to collect information about my use of the vehicle in accordance with the Privacy Policy.</li>
      <li>To allow Whip to text and call as set forth in the Agreement.</li>
      <li>I further acknowledge and agree to the dispute-resolution and arbitration provisions of the Agreement.</li>
    </ul>

    <!-- Signature row -->
    <div class="agr-sig-grid" style="margin-top:16pt;">
      <div class="agr-sig-field">
        <span class="agr-sig-label">Member Printed Name</span>
        <span class="agr-sig-line" style="min-height:16pt;">${fields.printedName || fields.memberName || ''}</span>
      </div>
      <div class="agr-sig-field">
        <span class="agr-sig-label">Signature</span>
        <span class="agr-sig-line">${sigImg}</span>
      </div>
      <div class="agr-sig-field">
        <span class="agr-sig-label">Customer ID</span>
        <span class="agr-sig-line" style="min-height:16pt;">${fields.customerId || ''}</span>
      </div>
    </div>

    <div class="agr-sig-grid" style="margin-top:8pt;">
      <div class="agr-sig-field">
        <span class="agr-sig-label">Date Signed</span>
        <span class="agr-sig-line" style="min-height:16pt;">${today}</span>
      </div>
      <div class="agr-sig-field">
        <span class="agr-sig-label">Rental ID</span>
        <span class="agr-sig-line" style="min-height:16pt;">${fields.reservationId || ''}</span>
      </div>
      <div class="agr-sig-field"></div>
    </div>

    ${footer3}
  </div>
  `;
}

// ── STATE-SPECIFIC ADDENDUM (PAGE 2 INTRO) ────────────────────────────────────
function buildPage1Addendum(sd: StateData): string {
  switch (sd.code) {
    case 'FL':
      return `
    <div class="agr-addendum-intro">For rentals originating in the following states, the applicable paragraphs will either replace or supplement the Agreement.</div>
    <span class="agr-addendum-state-title">Florida Rentals</span>
    <p class="agr-addendum-p">Failure to return rented property or equipment upon expiration of the rental period and failure to pay all amounts due are evidence of abandonment or refusal to redeliver the property, punishable under § 812.155, Florida Statutes.</p>
    <p class="agr-addendum-p">Florida law requires Whip's liability protection and personal injury protection to be primary unless otherwise stated. The valid and collectible liability insurance and PIP insurance of any authorized driver is primary for the limits required by §§ 324.021(7) and 627.736, Florida Statutes.</p>`;

    case 'GA':
      return `
    <div class="agr-addendum-intro">For rentals originating in the following states, the applicable paragraphs will either replace or supplement the Agreement.</div>
    <span class="agr-addendum-state-title">Georgia Rentals</span>
    <p class="agr-addendum-p">The weekly membership fee is subject to a sales/use tax of 7.75% applied to the total weekly charge. All rentals must be for a minimum of 31 days.</p>`;

    case 'IL':
      return `
    <div class="agr-addendum-intro">For rentals originating in the following states, the applicable paragraphs will either replace or supplement the Agreement.</div>
    <span class="agr-addendum-state-title">Illinois Rentals</span>
    <p class="agr-addendum-caps">FOR A CAR WITH AN MSRP OF $50,000 OR LESS, YOUR RESPONSIBILITY FOR LOSS OR DAMAGE DUE TO THEFT WILL NOT EXCEED $17,000 THROUGH MAY 31, 2025 (INCREASING BY $500 EACH JUNE 1). FOR A CAR WITH AN MSRP OF MORE THAN $50,000, YOUR RESPONSIBILITY WILL NOT EXCEED $54,000 THROUGH SEPTEMBER 30, 2024 (INCREASING BY $1,000 EACH OCTOBER 1).</p>
    <p class="agr-addendum-caps">THE FOREGOING CAPS APPLY UNLESS IT IS ESTABLISHED THAT YOU FAILED TO EXERCISE ORDINARY CARE WHILE IN POSSESSION OF THE CAR OR COMMITTED OR AIDED IN THE COMMISSION OF THE THEFT.</p>`;

    case 'MD':
      return `
    <div class="agr-addendum-intro">For rentals originating in the following states, the applicable paragraphs will either replace or supplement the Agreement.</div>
    <span class="agr-addendum-state-title">Maryland Rentals</span>
    <p class="agr-addendum-p">Except for coverage provided by the Maryland Automobile Insurance Fund with respect to a rental vehicle that is not a replacement vehicle, the coverage maintained by the renter of the rental vehicle is primary coverage.</p>
    <p class="agr-addendum-p">2013 Maryland Code — CRIMINAL LAW § 7-205: Failure to return rental vehicle</p>
    <p class="agr-addendum-p">(a) A person who leases or rents a motor vehicle under an agreement to return the motor vehicle at the end of the leasing or rental period may not abandon the motor vehicle or refuse or willfully neglect to return it.</p>
    <p class="agr-addendum-p">(b)(1) A person may not be prosecuted under this section if, within 5 days after a written demand for the return of the motor vehicle is mailed by certified mail, the person returns the motor vehicle. A prosecution may not be started until 5 days after a written demand is mailed.</p>
    <p class="agr-addendum-p">(c) A person who violates this section is guilty of a misdemeanor and on conviction is subject to imprisonment not exceeding 1 year or a fine not exceeding $500 or both.</p>
    <p class="agr-addendum-p">You may not need the automobile insurance offered by Whip Inc. Your automobile insurance policy may provide coverage for your liability while operating a rental vehicle. The purchase of insurance is not required as a condition of renting an automobile.</p>`;

    case 'PA':
      return `
    <div class="agr-addendum-intro">For rentals originating in the following states, the applicable paragraphs will either replace or supplement the Agreement.</div>
    <span class="agr-addendum-state-title">Pennsylvania Rentals</span>
    <p class="agr-addendum-caps">YOU ARE REJECTING UNINSURED MOTORIST COVERAGE UNDER THIS AGREEMENT, AND ANY POLICY OF INSURANCE OR SELF-INSURANCE ISSUED UNDER THIS AGREEMENT, FOR YOU AND ALL OTHER PASSENGERS OF THE VEHICLE. Uninsured motorist coverage protects you and other passengers in the vehicle for losses and damages suffered if injury is caused by the negligence of a driver who does not have any insurance to pay for losses and damages.</p>`;

    default:
      return '';
  }
}

// ── STATE-SPECIFIC RETURN OF VEHICLE NOTE ─────────────────────────────────────
function buildReturnOfVehicleNote(sd: StateData): string {
  switch (sd.code) {
    case 'FL':
      return ' Florida — Fla. Stat. § 812.155: Failure to return rented property upon expiration of the rental period and failure to pay all amounts due are evidence of abandonment or refusal to redeliver, punishable under Florida law.';
    case 'MD':
      return ' Maryland — Md. Criminal Law § 7-205: Failure to return a leased vehicle is a misdemeanor punishable by up to 1 year imprisonment or a fine up to $500 or both.';
    default:
      return '';
  }
}

// ── STATE-SPECIFIC GOVERNING LAW TEXT ─────────────────────────────────────────
function buildGoverningLawText(sd: StateData): string {
  switch (sd.code) {
    case 'MA':
      return 'This Agreement shall be governed by and construed in accordance with the laws of the Commonwealth of Massachusetts.';
    case 'PA':
      return 'This Agreement shall be governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania.';
    case 'VA':
      return 'This Agreement shall be governed by and construed in accordance with the laws of the Commonwealth of Virginia.';
    case 'OTHER':
      return "This Agreement shall be governed by and construed in accordance with the laws of the state in which the Member's primary market of operation is located.";
    default:
      return `This Agreement shall be governed by and construed in accordance with the laws of ${sd.govLaw}.`;
  }
}

// ── ADDON PAGES ───────────────────────────────────────────────────────────────
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

// ── MD PIP PAGES ──────────────────────────────────────────────────────────────
// Exact match to Maryland PIP Notice & Waiver per Md. Ins. Art. § 19-506
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
  const chkFull  = pipElection === 'full'  ? '&#9745;' : '&#9744;';
  const chkWaive = pipElection === 'waive' ? '&#9745;' : '&#9744;';

  return `
  <!-- MD PIP PAGE 1 — NOTICE -->
  <div class="pip-page" style="padding: 0.75in 0.8in;">

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

  <!-- MD PIP PAGE 2 — WAIVER -->
  <div class="pip-page pip-page-last" style="padding: 0.75in 0.8in;">

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

// ── GA UM PAGE ────────────────────────────────────────────────────────────────
// Exact match to Georgia UM Waiver per O.C.G.A. § 33-7-11
function buildGaUmPage(fields: Fields, sigDataURL: string | null, today: string): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="max-height:36pt;max-width:100%;object-fit:contain;object-position:left bottom;display:block;">`
    : '';

  return `
  <div class="wf-page wf-page-last" style="padding: 0.65in;">

    <!-- Title -->
    <div style="text-align:center; font-size:13pt; font-weight:bold; margin-bottom:14pt;">
      WAIVER OF UNINSURED MOTORIST COVERAGE<br>
      <span style="font-size:10pt; font-weight:normal;">State of Georgia — O.C.G.A. § 33-7-11</span>
    </div>

    <!-- Policy info table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:33%;">
          <strong style="font-size:8.5pt;">POLICY / CERTIFICATE NUMBER</strong><br>
          S0137
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:33%;">
          <strong style="font-size:8.5pt;">POLICY EFFECTIVE DATE</strong><br>
          &nbsp;
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:34%;">
          <strong style="font-size:8.5pt;">APPLICANT / NAMED INSURED</strong><br>
          ${name}
        </td>
      </tr>
    </table>

    <!-- Notice -->
    <p style="font-weight:bold;margin-bottom:8pt;">NOTICE</p>
    <p style="margin-bottom:8pt;">Georgia law requires every motor vehicle liability policy issued in this state to include Uninsured Motorist (UM) coverage unless the named insured rejects it in writing. Uninsured Motorist coverage protects you and all persons covered under this policy against bodily injury and property damage caused by the negligence of an owner or operator of an uninsured motor vehicle. An uninsured motor vehicle includes any vehicle whose owner or operator has no liability insurance, as well as any vehicle whose liability limits are insufficient to cover your damages.</p>
    <p style="margin-bottom:14pt;">If you do not sign this waiver, Uninsured Motorist coverage will be included in your policy at the applicable limits, and a corresponding premium will be charged.</p>

    <!-- Waiver -->
    <p style="font-weight:bold;margin-bottom:8pt;">WAIVER</p>
    <p style="margin-bottom:8pt;">I have fully read and understood the notice above. I understand that by signing this waiver, I am rejecting Uninsured Motorist coverage under the policy identified above for myself and all persons covered under the policy. I understand that no person covered under this policy will have UM protection for bodily injury or property damage caused by an uninsured or underinsured driver.</p>
    <p style="margin-bottom:14pt;">I further understand and agree that this waiver applies to all future renewals, reinstatements, replacement, and substitute policies unless I notify Metrocars Leasing Corp. in writing that I wish to elect coverage.</p>

    <!-- Signature table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">First Named Insured / Applicant — Printed Name</div>
          <div style="min-height:24pt;">${name}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">Date</div>
          <div style="min-height:24pt;">${today}</div>
        </td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">Signature of First Named Insured / Applicant</div>
          <div style="min-height:36pt;">${sigImg}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">Date</div>
          <div style="min-height:36pt;">&nbsp;</div>
        </td>
      </tr>
    </table>

    <!-- Insurer -->
    <p style="font-weight:bold;margin-bottom:4pt;">INSURER</p>
    <p style="margin-bottom:14pt;">Metrocars Leasing Corp. d/b/a Whip</p>

    <!-- Footer note -->
    <p style="font-style:italic;font-size:8.5pt;">Provided pursuant to O.C.G.A. § 33-7-11. A written rejection of UM coverage satisfies the statute. No state-mandated form is required in Georgia.</p>

  </div>`;
}

// ── FL UM PAGE ────────────────────────────────────────────────────────────────
// Exact match to Florida UM/UIM Rejection Form per § 627.727, Fla. Stat.
function buildFlUmPage(fields: Fields, sigDataURL: string | null, today: string): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="max-height:36pt;max-width:100%;object-fit:contain;object-position:left bottom;display:block;">`
    : '';

  return `
  <div class="wf-page wf-page-last" style="padding: 0.65in;">

    <!-- Title -->
    <div style="text-align:center; font-size:13pt; font-weight:bold; margin-bottom:4pt;">
      UNINSURED MOTORIST COVERAGE SELECTION / REJECTION FORM
    </div>
    <div style="text-align:center; font-size:10pt; margin-bottom:14pt;">
      State of Florida — § 627.727, Florida Statutes
    </div>

    <!-- Policy info table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:33%;">
          <strong style="font-size:8.5pt;">POLICY / CERTIFICATE NUMBER</strong><br>
          S0137
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:33%;">
          <strong style="font-size:8.5pt;">POLICY EFFECTIVE DATE</strong><br>
          &nbsp;
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:34%;">
          <strong style="font-size:8.5pt;">APPLICANT / NAMED INSURED</strong><br>
          ${name}
        </td>
      </tr>
    </table>

    <!-- Notice -->
    <p style="font-weight:bold;margin-bottom:8pt;">NOTICE — § 627.727, Florida Statutes</p>
    <p style="margin-bottom:8pt;">Florida law requires every motor vehicle liability policy issued in this state to provide Uninsured Motorist (UM) coverage unless the named insured rejects it or selects lower limits in writing. Uninsured Motorist coverage protects you and all persons covered under this policy against bodily injury caused by the negligence of an owner or operator of an uninsured or underinsured motor vehicle.</p>
    <p style="margin-bottom:8pt;">Florida offers UM in two forms:</p>
    <p style="margin-left:20pt;margin-bottom:6pt;">(1) <strong>Non-Stacked (Uninsured Only):</strong> UM benefits are limited to the single vehicle on which the coverage is written.</p>
    <p style="margin-left:20pt;margin-bottom:14pt;">(2) <strong>Stacked:</strong> UM benefits may be combined (stacked) across multiple covered vehicles.</p>

    <!-- Selection/Rejection table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
      <thead>
        <tr>
          <th style="border:1pt solid #000;padding:4pt 6pt;text-align:left;font-size:9pt;background:#f5f5f5;">COVERAGE OPTION</th>
          <th style="border:1pt solid #000;padding:4pt 6pt;text-align:center;font-size:9pt;background:#f5f5f5;">SELECT (&#9745;)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">I SELECT Uninsured Motorist Coverage — Non-Stacked at limits equal to my bodily injury liability limits.</td>
          <td style="border:1pt solid #000;padding:4pt 6pt;text-align:center;font-size:9pt;">&#9744;</td>
        </tr>
        <tr>
          <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">I SELECT Uninsured Motorist Coverage — Stacked at limits equal to my bodily injury liability limits.</td>
          <td style="border:1pt solid #000;padding:4pt 6pt;text-align:center;font-size:9pt;">&#9744;</td>
        </tr>
        <tr>
          <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;">I SELECT Uninsured Motorist Coverage — Non-Stacked at LOWER limits (specify below).</td>
          <td style="border:1pt solid #000;padding:4pt 6pt;text-align:center;font-size:9pt;">&#9744;</td>
        </tr>
        <tr>
          <td style="border:1pt solid #000;padding:4pt 6pt;font-size:9pt;font-weight:bold;">I REJECT Uninsured Motorist Coverage entirely. I understand I will have no UM protection.</td>
          <td style="border:1pt solid #000;padding:4pt 6pt;text-align:center;font-size:9pt;font-weight:bold;">&#9745;</td>
        </tr>
      </tbody>
    </table>

    <!-- Signature table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:10pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">SIGNATURE OF NAMED INSURED / APPLICANT</div>
          <div style="min-height:36pt;">${sigImg}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:28%;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">PRINTED NAME</div>
          <div style="min-height:36pt;">${name}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:22%;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">DATE</div>
          <div style="min-height:36pt;">${today}</div>
        </td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">PRODUCER NAME (PRINTED)</div>
          <div style="min-height:36pt;">Metrocars Leasing Corp. d/b/a Whip</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">PRODUCER SIGNATURE</div>
          <div style="min-height:36pt;"></div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">DATE</div>
          <div style="min-height:36pt;"></div>
        </td>
      </tr>
    </table>
    <p style="font-style:italic;font-size:8.5pt;text-align:center;margin-top:10pt;">This form is provided pursuant to § 627.727, Florida Statutes, and is intended to satisfy the written rejection / selection requirement of that section.</p>
  </div>`;
}

// ── PA UM/UIM REJECTION PAGE ──────────────────────────────────────────────────
// Exact match to Pennsylvania UM/UIM Rejection Form per 75 Pa.C.S. §§ 1731–1734
function buildPaPipPage(fields: Fields, sigDataURL: string | null, today: string): string {
  const name = fields.memberName || '';
  const sigImg = sigDataURL
    ? `<img src="${sigDataURL}" style="height:40pt;max-width:180pt;object-fit:contain;object-position:left bottom;">`
    : '';

  return `
  <div class="wf-page wf-page-last" style="padding: 0.65in;">

    <!-- Title -->
    <div style="text-align:center; font-size:13pt; font-weight:bold; margin-bottom:4pt;">
      REJECTION OF UNINSURED MOTORIST (UM) AND<br>
      UNDERINSURED MOTORIST (UIM) COVERAGE
    </div>
    <div style="text-align:center; font-size:10pt; margin-bottom:14pt;">
      Commonwealth of Pennsylvania — 75 Pa.C.S. §§ 1731–1734
    </div>

    <!-- Policy info table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:33%;">
          <strong style="font-size:8.5pt;">POLICY / CERTIFICATE NUMBER</strong><br>
          S0137
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:33%;">
          <strong style="font-size:8.5pt;">POLICY EFFECTIVE DATE</strong><br>
          &nbsp;
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:34%;">
          <strong style="font-size:8.5pt;">APPLICANT / NAMED INSURED</strong><br>
          ${name}
        </td>
      </tr>
    </table>

    <!-- Notice -->
    <p style="font-weight:bold;margin-bottom:8pt;">NOTICE — 75 Pa.C.S. §§ 1731–1734</p>
    <p style="margin-bottom:14pt;">Pennsylvania law requires every motor vehicle liability policy issued in the Commonwealth to provide Uninsured Motorist (UM) and Underinsured Motorist (UIM) coverage unless the named insured rejects each coverage in writing on a form containing the exact language required by 75 Pa.C.S. § 1731. The rejection language below is reproduced verbatim from the statute.</p>

    <!-- UM Rejection -->
    <p style="font-weight:bold;margin-bottom:8pt;">REJECTION OF UNINSURED MOTORIST COVERAGE</p>
    <p style="border:1pt solid #000;padding:8pt;margin-bottom:14pt;font-style:italic;">"By signing this waiver, I am rejecting uninsured motorist coverage under this policy, for myself and all relatives residing in my household. Uninsured coverage protects me and relatives living in my household for losses and damages suffered if injury is caused by the negligence of a driver who does not have any insurance to pay for losses and damages. I knowingly and voluntarily reject this coverage."</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">First Named Insured / Applicant — Printed Name</div>
          <div style="min-height:24pt;">${name}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">Date</div>
          <div style="min-height:24pt;">${today}</div>
        </td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">Signature of First Named Insured / Applicant</div>
          <div style="min-height:40pt;">${sigImg}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">Date</div>
          <div style="min-height:40pt;">&nbsp;</div>
        </td>
      </tr>
    </table>

    <!-- UIM Rejection -->
    <p style="font-weight:bold;margin-bottom:8pt;">REJECTION OF UNDERINSURED MOTORIST COVERAGE</p>
    <p style="border:1pt solid #000;padding:8pt;margin-bottom:14pt;font-style:italic;">"By signing this waiver, I am rejecting underinsured motorist coverage under this policy, for myself and all relatives residing in my household. Underinsured coverage protects me and relatives living in my household for losses and damages suffered if injury is caused by the negligence of a driver who has insurance, but not enough insurance to pay for losses and damages. I knowingly and voluntarily reject this coverage."</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">First Named Insured / Applicant — Printed Name</div>
          <div style="min-height:24pt;">${name}</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;width:50%;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">Date</div>
          <div style="min-height:24pt;">${today}</div>
        </td>
      </tr>
      <tr>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">Signature of First Named Insured / Applicant</div>
          <div style="min-height:40pt;">&nbsp;</div>
        </td>
        <td style="border:1pt solid #000;padding:4pt 6pt;vertical-align:top;">
          <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2pt;">Date</div>
          <div style="min-height:40pt;">&nbsp;</div>
        </td>
      </tr>
    </table>

    <p style="font-style:italic;font-size:8.5pt;">Rejection language reproduced verbatim from 75 Pa.C.S. § 1731(b.3) and § 1731(c.1) as required by statute. Salazar v. Allstate Ins. Co., 549 Pa. 658 (1997); Donnelly v. Bauer, 553 Pa. 596 (1998). Policy/Binder No. S0137 — Insurer: Metrocars Leasing Corp. d/b/a Whip.</p>

  </div>`;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  // Try to parse ISO date (YYYY-MM-DD) and format as M/D/YYYY
  const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (parts) {
    const [, y, m, d] = parts;
    return `${parseInt(m)}/${parseInt(d)}/${y}`;
  }
  return dateStr;
}

function extractMake(vehicleStr: string): string {
  // Vehicle format: "YYYY Make Model" — extract Make (second word)
  const parts = vehicleStr.trim().split(/\s+/);
  if (parts.length >= 2 && /^\d{4}$/.test(parts[0])) {
    return parts[1] || '';
  }
  return vehicleStr;
}

function extractModel(vehicleStr: string): string {
  // Vehicle format: "YYYY Make Model..." — extract Model (third word onwards)
  const parts = vehicleStr.trim().split(/\s+/);
  if (parts.length >= 3 && /^\d{4}$/.test(parts[0])) {
    return parts.slice(2).join(' ');
  }
  return '';
}
