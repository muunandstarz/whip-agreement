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
