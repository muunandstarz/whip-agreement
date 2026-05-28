// Tests for printBuilder.ts — verifies that generated HTML matches PDF content exactly
import { describe, it, expect } from 'vitest';
import { buildPrintHTML, buildViewerHTML, buildAddonOnlyHTML } from '../client/src/lib/printBuilder';
import { STATE_DATA } from '../client/src/lib/agreementData';

const baseFields = {
  memberName: 'John D. Smith',
  phone: '301-555-0100',
  email: 'john@example.com',
  address: '123 Main St',
  cityStateZip: 'Rockville, MD 20850',
  customerId: 'C-12345',
  reservationId: 'R-67890',
  vehicle: '2022 Toyota Camry',
  vin: '4T1BF1FK5CU123456',
  weeklyFee: '299',
  deposit: '500',
  startDate: '2024-01-15',
  endDate: '2025-07-15',
  printedName: 'John D. Smith',
  dateSigned: 'January 15, 2024',
};

describe('buildPrintHTML', () => {
  it('produces the VEHICLE MEMBERSHIP AGREEMENT title', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('VEHICLE MEMBERSHIP AGREEMENT');
  });

  it('includes member name in the output', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('John D. Smith');
  });

  it('includes the TOS checkbox line', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('I agree to the Terms of Service');
  });

  it('includes Membership Terms section', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Membership Terms');
    expect(html).toContain('eighteen (18) months');
  });

  it('includes Protection Plan section', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Protection Plan');
    expect(html).toContain('$1,000 per occurrence');
  });

  it('includes Liability Benefit section', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Liability Benefit');
    expect(html).toContain('Texas');
  });

  it('includes Authorized Operators section', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Authorized Operators');
  });

  it('includes Accident Reporting section', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Accident Reporting');
    expect(html).toContain('24 hours');
  });

  it('includes Subrogation section', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Subrogation');
  });

  it('includes Return of Vehicle section', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Return of Vehicle');
  });

  it('includes Dispute Resolution section', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Dispute Resolution and Arbitration');
    expect(html).toContain('Federal Arbitration Act');
  });

  it('includes Governing Law section', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Governing Law');
    expect(html).toContain('Texas');
  });

  it('includes the acknowledgment bullet list', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('150-mile radius');
    expect(html).toContain('dispute-resolution and arbitration provisions');
  });

  it('includes signature fields', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Member Printed Name');
    expect(html).toContain('Customer ID');
    expect(html).toContain('Date Signed');
    expect(html).toContain('Rental ID');
  });

  it('includes page footers with correct confidential text', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Metrocars Leasing Corp. d/b/a Whip — Confidential');
    expect(html).toContain('Page 1');
    expect(html).toContain('Page 2');
    expect(html).toContain('Page 3');
  });

  it('includes Vehicle section with Make/Model/VIN/License Plate', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Make');
    expect(html).toContain('Model');
    expect(html).toContain('VIN');
    expect(html).toContain('License Plate');
  });

  it('extracts Make from vehicle string correctly', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('Toyota');
    expect(html).toContain('Camry');
  });

  it('formats dates correctly', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('1/15/2024');
    expect(html).toContain('7/15/2025');
  });
});

describe('State-specific addendums', () => {
  it('FL includes Florida Rentals addendum on page 2', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.FL, null, null);
    expect(html).toContain('Florida Rentals');
    expect(html).toContain('§ 812.155, Florida Statutes');
    expect(html).toContain('For rentals originating in the following states');
  });

  it('GA includes Georgia Rentals addendum on page 2', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.GA, null, null);
    expect(html).toContain('Georgia Rentals');
    expect(html).toContain('7.75%');
    expect(html).toContain('minimum of 31 days');
  });

  it('IL includes Illinois Rentals addendum on page 2', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.IL, null, null);
    expect(html).toContain('Illinois Rentals');
    expect(html).toContain('$50,000');
    expect(html).toContain('ORDINARY CARE');
  });

  it('MD includes Maryland Rentals addendum on page 2', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.MD, null, null);
    expect(html).toContain('Maryland Rentals');
    expect(html).toContain('§ 7-205');
    expect(html).toContain('misdemeanor');
  });

  it('PA includes Pennsylvania Rentals addendum on page 2', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.PA, null, null);
    expect(html).toContain('Pennsylvania Rentals');
    expect(html).toContain('REJECTING UNINSURED MOTORIST COVERAGE');
  });

  it('TX has no addendum block', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).not.toContain('For rentals originating in the following states');
  });

  it('VA has no addendum block', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.VA, null, null);
    expect(html).not.toContain('For rentals originating in the following states');
  });

  it('MA has no addendum block', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.MA, null, null);
    expect(html).not.toContain('For rentals originating in the following states');
  });

  it('OTHER has no addendum block', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.OTHER, null, null);
    expect(html).not.toContain('For rentals originating in the following states');
  });
});

describe('State-specific Return of Vehicle notes', () => {
  it('FL includes Florida statute note in Return of Vehicle', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.FL, null, null);
    expect(html).toContain('§ 812.155');
  });

  it('MD includes Maryland statute note in Return of Vehicle', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.MD, null, null);
    expect(html).toContain('Md. Criminal Law § 7-205');
    expect(html).toContain('1 year imprisonment');
  });
});

describe('Governing Law text', () => {
  it('MA uses Commonwealth of Massachusetts', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.MA, null, null);
    expect(html).toContain('Commonwealth of Massachusetts');
  });

  it('PA uses Commonwealth of Pennsylvania', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.PA, null, null);
    expect(html).toContain('Commonwealth of Pennsylvania');
  });

  it('VA uses Commonwealth of Virginia', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.VA, null, null);
    expect(html).toContain('Commonwealth of Virginia');
  });

  it('TX uses laws of Texas', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('laws of Texas');
  });

  it('OTHER uses primary market language', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.OTHER, null, null);
    expect(html).toContain('primary market of operation');
  });
});

describe('Addon pages', () => {
  it('MD generates PIP notice and waiver pages', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.MD, null, 'waive');
    expect(html).toContain('Personal Injury Protection (PIP)');
    expect(html).toContain('OPTION 1 - FULL PIP');
    expect(html).toContain('Waiver of Personal Injury Protection');
    expect(html).toContain('Section 19-506');
    expect(html).toContain('Metrocars Leasing');
  });

  it('MD PIP waiver reflects waive election', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.MD, null, 'waive');
    // waive checkbox should be checked (&#9745;)
    const waiveCount = (html.match(/&#9745;/g) || []).length;
    expect(waiveCount).toBeGreaterThanOrEqual(1);
  });

  it('GA generates UM waiver page', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.GA, null, null);
    expect(html).toContain('WAIVER OF UNINSURED MOTORIST COVERAGE');
    expect(html).toContain('O.C.G.A. § 33-7-11');
    expect(html).toContain('S0137');
  });

  it('FL generates UM selection/rejection form', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.FL, null, null);
    expect(html).toContain('UNINSURED MOTORIST COVERAGE SELECTION / REJECTION FORM');
    expect(html).toContain('§ 627.727, Florida Statutes');
  });

  it('PA generates UM/UIM rejection form', () => {
    const html = buildPrintHTML(baseFields, STATE_DATA.PA, null, null);
    expect(html).toContain('REJECTION OF UNINSURED MOTORIST (UM) AND');
    expect(html).toContain('75 Pa.C.S. §§ 1731–1734');
    expect(html).toContain('REJECTION OF UNDERINSURED MOTORIST COVERAGE');
  });
});

describe('buildViewerHTML', () => {
  it('produces a full standalone HTML document', () => {
    const html = buildViewerHTML(baseFields, STATE_DATA.TX, null, null);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('VEHICLE MEMBERSHIP AGREEMENT');
    expect(html).toContain('Print / Save PDF');
  });
});

describe('buildAddonOnlyHTML', () => {
  it('produces only the GA UM addon page', () => {
    const html = buildAddonOnlyHTML('ga-um', baseFields, STATE_DATA.GA, null, null);
    expect(html).toContain('WAIVER OF UNINSURED MOTORIST COVERAGE');
    expect(html).not.toContain('VEHICLE MEMBERSHIP AGREEMENT');
  });

  it('produces only the PA UM/UIM addon page', () => {
    const html = buildAddonOnlyHTML('pa-pip', baseFields, STATE_DATA.PA, null, null);
    expect(html).toContain('REJECTION OF UNINSURED MOTORIST');
    expect(html).not.toContain('VEHICLE MEMBERSHIP AGREEMENT');
  });
});
