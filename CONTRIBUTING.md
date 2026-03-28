 feat/accessibility-audit
# Contributing to NiffyInsur

## Accessibility Testing

Accessibility is a first-class requirement. Every PR that touches UI must pass the checks below before merge.

### Automated axe checks (CI)

The `accessibility` CI job runs `@axe-core/playwright` against the quote, policy, claims, and vote routes. **No critical violations are permitted.** The job uploads a Playwright report as an artifact on failure.

Run locally:

```bash
cd frontend
npm install
npm run build
npx playwright test tests/accessibility.spec.ts
```

### Manual axe spot-check

1. Install the [axe DevTools browser extension](https://www.deque.com/axe/devtools/).
2. Open each targeted route: `/quote`, `/policy`, `/claims`, `/claims/<id>`.
3. Run the full-page scan. Resolve any **critical** or **serious** violations before opening a PR.

### Keyboard-only walkthrough

Verify these flows using only the keyboard (no mouse):

| Flow | Steps |
|------|-------|
| Get a quote | Tab through all form fields → submit → confirm quote preview updates |
| Purchase policy | Complete all 4 wizard steps using Tab / Shift+Tab / Enter / Space |
| File a claim | Complete all 4 wizard steps; confirm focus moves to new step heading on advance |
| Cast a vote | Tab to Approve / Reject buttons → Enter to open confirm modal → Tab within modal → confirm or cancel |
| Connect wallet | Tab to "Connect Wallet" button → Enter → confirm status announced |

Focus must always be visible. After a modal opens, focus must move inside it. After a modal closes, focus must return to the trigger.

### Screen reader spot-check (per major release)

Test at minimum one major flow per release with a screen reader:

- **macOS / iOS**: VoiceOver (`Cmd+F5` to toggle)
- **Windows**: NVDA (free) or Narrator
- **Android**: TalkBack

Checklist:
- [ ] Transaction status updates are announced (aria-live regions on wizard and policy pages)
- [ ] Step changes in wizards are announced (focus moves to hidden `<h2>` with step name)
- [ ] Quote preview updates are announced on the quote page
- [ ] Vote tally countdown is announced via `aria-live="polite"`
- [ ] Modal title is read when dialog opens
- [ ] Icon-only buttons have accessible names (aria-label or sr-only text)
- [ ] Claim status badges convey outcome via text/shape, not color alone

### Reduced-motion

Verify that setting `prefers-reduced-motion: reduce` (OS accessibility setting or DevTools emulation) stops all non-essential animations. Loading spinners should become static; slide/fade transitions should be instant.

### Heading hierarchy

Each page must have exactly one `<h1>`. Use the browser Accessibility Tree panel (DevTools → Accessibility) or the [HeadingsMap extension](https://rumoroso.bitbucket.io/headingsmap/) to verify a logical heading order with no skipped levels.

### Landmarks

Every page must have at minimum: `<main>`, `<nav>` (if navigation present), and `<footer>` (if present). Verify with the Accessibility Tree or axe.

### Color contrast

All text must meet WCAG AA contrast ratios (4.5:1 normal text, 3:1 large text). Use the axe scan or the browser color-contrast checker. Claim outcomes (Approved / Rejected / Pending) must not rely on color alone — shape indicators and text labels are required.

### Adding new UI

When adding new interactive components:

1. Icon-only controls **must** have `aria-label` or a visually hidden label.
2. Async state changes (transactions, loading) **must** update an `aria-live` region.
3. Multi-step wizards **must** move focus to a step heading on step change.
4. Modals **must** trap focus and return it to the trigger on close (Radix Dialog handles this automatically).
5. Animations **must** respect `prefers-reduced-motion` via the global CSS rule in `globals.css`.

# Contributing

## Soroban ABI golden vectors

The file `backend/src/soroban/golden-vectors.json` records the exact ScVal
type and argument order for every critical contract invocation.  CI fails if
the builders produce output that no longer matches these vectors.

### When to refresh

Refresh the vectors whenever you change:

- Any function signature in `contracts/niffyinsure/src/lib.rs`
- Argument builders in `backend/src/soroban/soroban.client.ts` or `backend/src/tx/tx.service.ts`
- Enum variants in `contracts/niffyinsure/src/types.rs`

### How to refresh

```bash
cd backend
npm run refresh-vectors
```

Review the diff carefully:

```bash
git diff backend/src/soroban/golden-vectors.json
```

- If the contract ABI changed (argument order, types, new/removed args), bump
  `_meta.contractSemver` in the JSON to match the new contract semver tag.
- If only the builder logic changed without an ABI change, leave `contractSemver`
  as-is and explain in the PR description.

Commit the updated file and open a PR.  A second engineer must review and
approve any vector changes before merge.

### Release checklist item

Before tagging a release:

- [ ] Run `npm run refresh-vectors` and confirm the diff is empty (or intentional).
- [ ] Confirm `_meta.contractSemver` matches the contract's `Cargo.toml` version.
- [ ] Update `contracts/deployment-registry.json` with the new wasm hash.

### Security rules

- **Never** commit real private keys (Stellar secret keys start with `S`).
- Use only placeholder G-addresses and C-addresses in vector `inputs`.
- The CI job checks for secret-key patterns and will fail if any are found.
 main
