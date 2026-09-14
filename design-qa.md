# Design QA

- Source visual truth: two attendance-review reference images attached in the current user request.
- Implementation: `/generate-payroll` � employee action � Cutoff Attendance � Review/Resolve.
- Intended viewport: desktop, approximately 1365 � 768 CSS pixels at device scale factor 1.
- Source pixel dimensions: first reference 851 � 373; second reference 837 � 473.
- Implementation screenshot: unavailable.
- State: Cutoff Attendance summary plus the opened Review/Resolve attendance dialog.

## Full-view comparison evidence

Blocked. The in-app browser connection failed before the local page could be opened or captured. The production build and TypeScript checks pass, but those checks are not substitutes for browser-rendered evidence.

## Focused-region comparison evidence

Blocked for the same reason. The intended focused regions are:

1. The Cutoff Attendance columns, including the new OT In - Out cell.
2. The opened DTR evidence table showing Time 1, Time 2, and Overtime In/Out.
3. The classification, approved-hours, reason, Cancel, and Save controls.

## Findings

- [P1] Browser-rendered comparison unavailable
  - Location: local `/generate-payroll` Review/Resolve workflow.
  - Evidence: source references are available, but no implementation screenshot could be captured because the in-app browser runtime failed to connect.
  - Impact: responsive layout, clipping, and final visual fidelity cannot be certified.
  - Fix: reconnect the in-app browser, open a generated payroll employee, click Review and Resolve, capture both states, and compare at the intended desktop viewport.

## Required fidelity surfaces

- Fonts and typography: code uses the existing payroll typography and scale; browser verification blocked.
- Spacing and layout rhythm: compact table and responsive two-column dialog implemented; browser verification blocked.
- Colors and visual tokens: existing slate, teal, amber, and red semantic tokens reused; browser verification blocked.
- Image quality and asset fidelity: no custom raster assets are present in the target; existing Lucide icons are used.
- Copy and content: required Date/Week, Time In - Out, OT In - Out, Raw, Classification, Regular, Payable, and Action labels are implemented. Review/Resolve exposes Time 1, Time 2, OT, sites, aliases, approved hours, and reason.

## Comparison history

- Initial implementation was split after code review because the dialog exceeded the repository's preferred component size.
- Post-fix components are 226 and 203 lines and the production build passes.
- No browser-rendered comparison iteration was possible.

## Primary interactions checked

- Automated/code-level: Review and Resolve share the existing open/save/close state path; Save preserves the existing attendance decision payload.
- Browser interaction: blocked.
- Console errors: not checked because the browser could not connect.

## Implementation checklist

- [x] Preserve distinct Time 1, Time 2, and OT punches.
- [x] Preserve each punch's site, multi-site path, and raw biometric aliases.
- [x] Add OT In - Out to Cutoff Attendance.
- [x] Open detailed DTR evidence from both Review and Resolve.
- [x] Preserve classification and approved-hour editing.
- [x] Pass automated tests, TypeScript, and production build.
- [ ] Capture and compare the browser-rendered states.

## Follow-up polish

- Reassess table width and small-screen wrapping after browser capture.

final result: blocked
