# Design QA

- Source visual truth: `design-references/resolve-review.png`, supplied as `C:\Users\User\Downloads\resolve review.png`.
- Source dimensions: 1680 � 940 pixels.
- Implementation route and state: `/generate-payroll` � employee action � Cutoff Attendance � Review/Resolve.
- Intended comparison viewport: 1440 � 900 CSS pixels, device scale factor 1.
- Implementation screenshot: unavailable.
- State under review: opened attendance Review/Resolve modal with biometric DTR evidence and approval form.

## Full-view comparison evidence

Blocked. The local application was started successfully, but the required in-app browser failed during connection because its Windows sandbox could not initialize read access. No browser-rendered implementation screenshot could be captured.

## Focused-region comparison evidence

Blocked for the same reason. The intended focused comparisons are:

1. Header hierarchy and employee/date context.
2. DTR log table, Complete/Missing status, and six punch timeline entries.
3. Site movement, raw alias, and detected-overtime cards.
4. Classification, approved hours, reason, and footer actions.

## Findings

- [P1] Browser-rendered comparison unavailable
  - Location: local Generate Payroll Review/Resolve workflow.
  - Evidence: the local server is available, while the implementation could not be opened or captured through the required in-app browser.
  - Impact: final responsive spacing, clipping, and pixel-level fidelity cannot be certified.
  - Fix: restore the in-app browser connection, open Review and Resolve states at 1440 � 900, capture them, and compare against the source.

## Required fidelity surfaces

- Fonts and typography: existing ProBuild font stack, weights, compact labels, and hierarchy are reused; browser verification blocked.
- Spacing and layout rhythm: wide two-panel modal, contextual header, card spacing, scrollable evidence, and fixed footer are implemented; browser verification blocked.
- Colors and visual tokens: existing slate, teal, amber, and red semantic tokens are used; browser verification blocked.
- Image quality and asset fidelity: the target contains no required raster content inside the modal. Existing Lucide system icons are used rather than copying decorative reference icons.
- Copy and content: Attendance Resolution, canonical employee/date context, Biometric DTR Logs, Time 1, Time 2, Overtime, statuses, Punch Timeline, Site Movement, Raw Biometric Aliases, detected OT, classification, approved hours, reason, Cancel, and Save are implemented.

## Comparison history

- The earlier compact modal was expanded to follow the supplied information hierarchy.
- Canonical employee, site, date, and raw-hour context were added using actual payroll data.
- DTR rows now show Site / Source and Complete/Missing status.
- A six-entry timeline exposes Time 1, Time 2, OT In, and OT Out independently.
- Header positioning was changed to a responsive grid after code review.
- Production build and all 130 automated tests pass.
- Browser connection was retried on 2026-09-15 and failed with the same Windows sandbox initialization error.

## Primary interactions checked

- Code-level: Review and Resolve use the real attendance decision flow; Cancel, close, outside-click, Escape, classification, approved hours, reason validation, and Save remain connected.
- Browser interaction: blocked.
- Console errors: not checked because the browser could not connect.

## Implementation checklist

- [x] Follow the reference modal information hierarchy.
- [x] Use existing system colors and icon library.
- [x] Show real canonical employee and site context.
- [x] Show Time 1, Time 2, and OT In/Out with per-punch sites.
- [x] Show Complete/Missing status and punch timeline.
- [x] Preserve Review/Resolve behavior and attendance calculations.
- [x] Pass TypeScript, production build, and all automated tests.
- [ ] Capture and compare browser-rendered Review and Resolve states.

## Follow-up polish

- Reassess the six-column timeline density on narrow laptop widths after browser capture.

final result: blocked
