# Whip Agreement TODO

## Completed
- [x] Initial agreement flow (welcome, info, TOS, agreement, sign, addons, complete)
- [x] MD PIP form (exact HTML match)
- [x] GA UM rejection form (exact HTML match)
- [x] FL UM/UIM rejection form (exact HTML match)
- [x] PA coverage election form
- [x] Per-document separate print (View button per doc)
- [x] Remove rep signature block
- [x] Remove email from claim filing instructions
- [x] Fix "Other State" header
- [x] Fix extra blank page before addon forms
- [x] Upgrade to full-stack (db + server + user)
- [x] nodemailer installed

## In Progress
- [x] Fix PIP form to match WhipMemberAgreement(3).pdf single-column layout
- [x] Fix support links: home page → local office phone, bottom bar → help desk text line
- [x] Dashboard page: reservation details, market location, vehicle info with car icon/color, forms modules
- [x] Vehicles page: vehicle info, digital POI card (Assurant-style), coverage breakdown with state limits, PIP/UM explanations
- [x] Profile page: editable phone/email, market address and phone
- [x] Gmail email delivery (deferred — user approved, will connect when Gmail credentials provided)
- [x] Trip History tab: vehicle timeline (YMM, last 6 VIN, dates per reservation/swap/loaner)
- [x] Invoicing tab: current balance breakdown (weekly, tickets, tolls, late fees) + past invoices list
- [x] Replace cartoon car SVG with clean outline silhouette in MemberPortal (dashboard + vehicles + trip history)
- [x] Remove Coming Soon blur from Invoicing page — make it fully demo-able
- [x] Addon forms kept (user confirmed they are required)
- [x] Add "You're Done" completion screen before the portal tab view
- [x] Make all agreement inputs required — every field must be filled before proceeding
- [x] MD PIP form rebuilt as proper 2-page 2-column layout
- [x] Remove footer from PIP print form (keep 2-page 2-column)
- [x] Add Print PDF buttons to You're Done screen for each signed document
- [x] Fix POI card modal overflow — full card must be visible without clipping

## Demo Mode (v1 presentation link)
- [x] Add mode=demo: lock all fields except DOB/phone/address/email, hide portal and account creation
- [x] Fix PIP form pixel-perfect 2-page 2-column (verify against original HTML)
- [x] Combined PDF view in new browser tab (agreement + addons as one readable document)

## P0 Fixes (demo mode)
- [x] Fix missing margins on agreement-only/demo mode view
- [x] Fully block portal and account creation in mode=demo and mode=agreement

## Enterprise Agreement Management Platform
- [x] DB: members table (all imported fields + field lock metadata)
- [x] DB: agreements table (status, token, expiry, version, state, member_id)
- [x] DB: agreement_events table (opened, verified, signed, abandoned, IP, device, timestamp)
- [x] DB: documents table (S3 keys for executed PDFs, audit certs, state forms)
- [x] DB: admin_users table with role enum (admin/manager/readonly)
- [x] DB: push schema migrations
- [x] Admin dashboard shell: top nav, tab layout, protected route, role-based access
- [x] Agreement tracking board: status columns, filters, metrics cards
- [x] Exception queue: failed verification, mismatches, duplicates, abandoned
- [x] Member import: CSV upload with field mapping UI
- [x] Member import: manual entry form
- [x] Member import: matching logic (Customer ID, Reservation ID, VIN, email, phone, DL)
- [x] Member import: mismatch flagging, prevent accidental sends
- [x] Secure link generation: UUID token, configurable expiry, per-member
- [x] Verification gate: DOB + last 4 DL + email code (before agreement opens)
- [x] Token invalidation: on completion, expiry, manual revocation
- [x] Email distribution: send/resend individual via Gmail SMTP
- [x] Email distribution: bulk send with templates (initial, reminder, final notice, expired)
- [x] SMS distribution: TextLine API integration stubbed (needs API key)
- [x] Delivery tracking: sent → delivered → opened → clicked → verified → signed
- [x] Document storage: auto-generate executed PDF + state forms + audit cert to S3 on completion
- [x] Document retrieval: search by member/VIN/reservation/customer ID/state
- [x] Secure re-access link generation for lost agreements
- [x] Role-based access: admin full access, manager resend/view/download, readonly status only
- [x] Agreement history per member: prior agreements, execution dates, IP/device, versions
- [x] /agreement/:token route with identity verification gate
- [x] Admin tRPC router wired into appRouter
- [x] Admin dashboard UI: Overview, Members, Agreements, Generate Link tabs

## Deferred
- [x] Gmail credentials — replaced by cPanel SMTP (insurance@drivewhip.com)
- [x] TextLine API key — wired (xo79ytdfv7thm5s6i07l)
- [ ] Member account creation / login / forgot password flow (future phase, pending drivewhip.com integration)

## Email & SMS Integration
- [x] Wire SMTP via cPanel webmail (insurance@drivewhip.com, host: c60263.sgvps.net)
- [x] Replace nodemailer stub with live SMTP delivery for send/resend/reminder/expiry emails
- [x] Wire TextLine API key for SMS send/resend
- [x] Email and SMS tests passing (19 total)
- [ ] Live end-to-end test with real member — pending valid TextLine API key; email SMTP confirmed working

## Member Login (drivewhip.com goal)
- [ ] drivewhip.com/login → member portal (future phase, requires drivewhip.com dev team integration)

## Data Format Notes
- Reservation ID format: [member number]-[last 6 of VIN]-[mmddyyyy of pickup] e.g. 1042-N09186-05012026
- [ ] Parse and display reservation ID components (member #, VIN suffix, pickup date) in member detail and agreement views (future enhancement)

## Bug Fixes
- [x] Fix "Member not found" error — Generate tab now uses live member search dropdown; origin passed correctly from browser

## Bulk Operations
- [x] tRPC: admin.agreements.bulkSend — generate + send to all members without active agreement
- [x] tRPC: admin.agreements.bulkResend — reminder to all Sent/Expired agreements
- [x] UI: Bulk Send button in Agreements tab with channel selector (Email/SMS/Both) + confirmation step
- [x] UI: Bulk Resend button with same confirmation + progress modal showing sent/failed/skipped
- [x] Rate limiting: 200ms stagger between sends (safe for 1,400 members ~5 min total)

## Member Management
- [x] tRPC: admin.members.update — edit any field on an existing member
- [x] UI: Edit Member button/drawer in Members tab with pre-filled form for all 17 fields

## UX Restructure
- [x] Make admin dashboard the root route (/); member agreement at /agreement
- [x] Add admin shield icon in member portal header (top-right, only visible to admin/manager role) linking to /admin
- [x] Add "Member Portal" link in admin dashboard header linking to /agreement
- [x] Fix contact support links: help desk phone + TextLine number on AgreementPage and MemberPortal support tab
- [x] Post-sign member dashboard already exists (MemberPortal with Dashboard, Vehicle, Trips, Invoices, Support, Profile tabs)
- [ ] Ensure login flow from drivewhip.com redirects to member portal after auth (requires drivewhip.com integration)

## ChargeOver Integration
- [x] DB: chargeover_customers, chargeover_invoices, chargeover_invoice_lines, chargeover_webhook_events tables
- [x] DB: schema pushed to database
- [x] Server: ChargeOver API client (server/chargeover.ts) — Basic auth, GET /invoice, GET /customer, upsertInvoice, syncMemberBilling, processWebhook
- [x] tRPC: billing.getMyInvoices — member invoice list with sort/filter (date, status, amount, type)
- [x] tRPC: billing.getInvoiceDetail — single invoice with line items
- [x] tRPC: billing.syncMember / billing.syncAll — admin-triggered manual sync
- [x] tRPC: billing.getAdminSummary — open/past_due/paid counts and balances
- [x] tRPC: billing.linkMember — manually link member to ChargeOver customer ID
- [x] Webhook: POST /api/webhooks/chargeover — receives invoice events, upserts DB
- [x] Member portal: Invoices tab — live tRPC data, sort by date/status/amount, filter by type (weekly/ticket/toll/all)
- [x] Member portal: Invoice detail drawer — line items, due date, balance, PDF link
- [x] ENV: CHARGEOVER_BASE_URL, CHARGEOVER_USERNAME, CHARGEOVER_PASSWORD — documented for dev team handoff

## UI Fixes
- [x] Trip history: vehicle-type-aware silhouette icons (sedan/SUV/truck/van/motorcycle)
- [x] Insurance card: "File a Claim" text on back is now a clickable link → https://drivewhip.com/file-a-claim

## Workflow Fixes
- [x] Auto-generate agreement link when member is created (single add) or bulk imported
- [x] Agreements tab: Send button on each row auto-generates link if none exists, then sends
- [x] Agreements tab: multi-select checkboxes + "Send Selected" action bar (email/SMS/both)
- [x] Admin dashboard header: prominent orange Member Portal button (visible on all screen sizes)
- [x] Generate Link tab still available for manual use; no longer required for normal send flow

## Bug Fixes (Round 2)
- [x] Member list: Market column added (derived from agreementState via getMarketForState)
- [x] Verification gate: real Whip image logo on gate, error, and loading screens
- [x] Agreement form: pre-fill fixed — member data passed directly as props after verification
- [x] Admin dashboard: prominent orange Member Portal toggle button in header
- [x] Agreements tab: multi-select checkboxes + Send to Selected action bar

## Market Configuration
- [x] 9 markets defined: Rockville, Glen Burnie, Atlanta, Chicago, Dallas, Philadelphia, Boston, Miami, Orlando, Richmond
- [x] Each market's garaging state = the state it physically operates in
- [x] MD members: Rockville or Glen Burnie distinguished by market field on member record (same state, different market)
- [x] FL members: Miami or Orlando distinguished by market field on member record (same state, different market)
- [x] State drives the legal workflow/forms; market field drives the admin list display

## Bug Fixes (Round 3)
- [x] SMTP confirmed working — test email sent successfully; send failure likely a TextLine API key issue
- [x] TextLine API key 401 — needs corrected key from TextLine Settings → API (current key rejected)
- [x] Member portal header: admin shield + "Admin" label button added (orange, admin/manager only)
- [x] Scheduled auto-reminders: heartbeat cron fires daily, sends at 24h/48h/72h after agreement sent, max 3 reminders
- [x] scheduleCronTaskUid column added to agreements table and pushed to DB
- [x] Reminder handler at POST /api/scheduled/sendReminder — authenticates via sdk.authenticateRequest

## Scheduled Reminders
- [x] Auto-reminder cron created on each agreement send (24h/48h/72h intervals)
- [x] Reminder handler checks elapsed time, skips if already signed/revoked/expired
- [x] Max 3 auto-reminders per agreement (stops after 72h)
- [x] Manual bulk resend still available in Agreements tab for on-demand reminders

## P0 Investigation Findings (May 28, 2026)
- [x] SMTP env vars confirmed SET at runtime (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- [x] Direct SMTP test confirmed working — email sent to jasminea@drivewhip.com successfully
- [x] Root cause: no send mutation was ever triggered — admin had 0 members with agreements in the DB
- [x] Send flow code is correct — sendEmail/sendSms called properly in send/sendToMembers/bulkSend
- [x] Added explicit [Send] and [SendToMembers] console.log tracing in admin.ts send procedures
- [x] Added testEmail and testSms tRPC procedures (admin.testEmail / admin.testSms)
- [x] Added Delivery Test panel in Overview tab (test email/SMS without needing a member record)
- [ ] TextLine API key (xo79ytdfv7thm5s6i07l) returns 401 — needs replacement key from TextLine Settings → API
- [ ] Live end-to-end send test with real member (add member → send → confirm receipt)

## Reservation ID Auto-Generation
- [ ] Manual add member form: auto-compute reservationId when memberId + VIN + startDate are all filled
- [ ] Edit member drawer: same auto-compute logic on field change
- [ ] Bulk CSV import: compute reservationId server-side after upload if not already present in CSV
- [ ] Server-side helper: buildReservationId(memberId, vin, startDate) → "[memberId]-[last6VIN]-[mmddyyyy]"
