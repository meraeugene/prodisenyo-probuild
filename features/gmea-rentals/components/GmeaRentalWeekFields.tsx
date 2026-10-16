"use client";
import type { RentalWeekMetadata, RentalWeekSection } from "../utils/rentalReportingWeeks";
import { rentalInputClass } from "../utils/rentalUi";
export default function GmeaRentalWeekFields({ week, existing, onChange }: { week: RentalWeekMetadata; existing: boolean; onChange: (week: RentalWeekMetadata) => void }) {
  return <div className="grid gap-4 rounded bg-teal-50 p-4 sm:col-span-2 lg:col-span-3 sm:grid-cols-2 lg:grid-cols-4">
    <label className="space-y-1.5 text-sm font-medium">Reporting month *<input required data-validation-message={week.start && week.month !== week.start.slice(0, 7) ? "Reporting month must match the week start." : undefined} aria-label="Week reporting month" type="month" value={week.month} disabled={existing} className={rentalInputClass} onChange={event => onChange({ ...week, month: event.target.value })} /></label>
    <label className="space-y-1.5 text-sm font-medium">Week start *<input required aria-label="Week start" type="date" value={week.start} disabled={existing} className={rentalInputClass} onChange={event => onChange({ ...week, start: event.target.value, month: event.target.value.slice(0,7) })} /></label>
    <label className="space-y-1.5 text-sm font-medium">Week end *<input required min={week.start} aria-label="Week end" type="date" value={week.end} disabled={existing} className={rentalInputClass} onChange={event => onChange({ ...week, end: event.target.value })} /></label>
    <label className="space-y-1.5 text-sm font-medium">Section *<select required aria-label="Week expense section" value={week.section} className={rentalInputClass} onChange={event => onChange({ ...week, section: event.target.value as RentalWeekSection })}><option value="equipment">Equipment</option><option value="cash-advance">Cash advance</option><option value="salary">Salary</option></select></label>
    <p className="text-xs text-teal-800 sm:col-span-2 lg:col-span-4">Use the expense’s actual date and price. The full cutoff total belongs to its reporting month.</p>
  </div>;
}
