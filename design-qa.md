# Generate Payroll Design QA

- Source visual truth: `payroll-reference.png`
- Source pixels: 1680 × 947
- Implementation screenshot: not captured — the in-app browser runtime was blocked by the Windows sandbox before a tab could be opened
- Intended comparison viewport: 1680 × 947 CSS pixels at device scale factor 1
- State: signed-in payroll manager, generated payroll preview, All Employees tab
- Density normalization: source is treated as 1×; implementation density could not be measured

**Findings**

- [P1] Browser-rendered visual evidence is unavailable
  - Location: `/generate-payroll`
  - Evidence: the production build and targeted lint pass, but the required in-app browser kernel exits during startup with a Windows sandbox ACL error. No implementation screenshot can be placed beside the reference.
  - Impact: typography, spacing, table density, sticky summary behavior, and responsive overflow cannot be certified from rendered evidence.
  - Fix: restore in-app browser access, open the local route at 1680 × 947, capture the generated-payroll state, and compare it with `payroll-reference.png`.

**Required Fidelity Surfaces**

- Fonts and typography: implemented with the app's SF Pro/system stack and reference-aligned sizes; browser comparison blocked.
- Spacing and layout rhythm: header, KPI cards, tab rail, filters, dense table, pagination, and sticky summary are implemented; browser comparison blocked.
- Colors and visual tokens: navy text, teal actions/success, amber review states, pale blue-gray borders, and white surfaces are implemented; browser comparison blocked.
- Image quality and asset fidelity: the reference contains no page-specific raster artwork; existing brand assets and the installed icon system are preserved.
- Copy and content: Generate Payroll hierarchy, payroll period, status counts, filters, employee details, and submission labels are implemented.

**Full-view Comparison Evidence**

Blocked. The source image is available, but a browser-rendered implementation capture could not be produced.

**Focused Region Comparison Evidence**

Blocked for the header/actions, KPI cards, control rail, employee rows, and bottom summary because browser capture is unavailable.

**Primary Interactions**

- Implemented: generate preview, submit payroll report, review tabs, attendance logs tab, employee search, site filter, sorting, clear filters, rates, paid holidays, bulk payslip export, employee action menu, edit employee, export payslip, pagination, and View Exceptions.
- Browser interaction test: blocked before navigation.
- Console errors checked: blocked before navigation.

**Implementation Checklist**

- Restore the in-app browser connection.
- Capture `/generate-payroll` at 1680 × 947 in the generated state.
- Compare the source and implementation together.
- Fix any visible P1/P2 differences and repeat the capture.

**Comparison History**

- Pass 1: blocked before visual comparison; no browser-rendered evidence was available.
- Pass 2: removed employee selection checkboxes and the 1,050px table minimum. Added a full-width desktop table plus responsive employee cards and wrapping controls so normal browser zoom no longer hides payroll fields. Production build, TypeScript, and targeted lint pass; browser-rendered comparison remains blocked by the in-app browser sandbox.

final result: blocked
