# Whip Member Agreement App — Design Ideas

## Design Philosophy Chosen: **Precision Legal**

**Design Movement:** Corporate Modernism meets Legal Document Design
**Core Principles:**
1. White-dominant canvas — the agreement IS the product; UI chrome is minimal
2. Navy (#171b31) for authority and trust; orange (#ff6221) for action and progress only
3. Step-by-step wizard with clear spatial separation between phases
4. Print fidelity — screen and print share the same typographic DNA

**Color Philosophy:**
- Background: pure white (#ffffff)
- Primary text: near-black (#1a1a1a)
- Brand navy (#171b31): top bar, step indicators, section headers
- Brand orange (#ff6221): CTAs, active step, progress fill, signature prompt
- Muted gray (#f5f5f5): field backgrounds, disabled states
- No gradients on content areas — only on the top header bar

**Layout Paradigm:**
- Single-column centered wizard, max-width 720px
- Fixed top bar with logo + step counter
- Sticky progress rail below top bar
- Content card with clean white background, subtle shadow
- Each step slides in from the right, exits to the left

**Signature Elements:**
1. Orange progress bar that fills as steps complete
2. Navy header bar with white Whip logo (left) + step label (right)
3. Section dividers: thin orange rule under section titles

**Interaction Philosophy:**
- Fields pre-filled from URL params are visually distinct (light blue tint, lock icon)
- TOS scroll-lock: orange "Scroll to read" indicator, unlocks at bottom
- Signature canvas: orange border, clears on double-tap
- Print button: navy background, triggers browser print dialog

**Animation:**
- Step transitions: 200ms slide + fade
- Button press: scale(0.97) 160ms ease-out
- Progress bar: smooth fill 300ms ease-out
- Field focus: border color transition 150ms

**Typography System:**
- Headings: Inter 700 (clean, authoritative)
- Body/legal text: Georgia serif (matches print output)
- Labels: Inter 500 uppercase tracking-wide 11px
- Monospace fields (IDs, VIN): JetBrains Mono
