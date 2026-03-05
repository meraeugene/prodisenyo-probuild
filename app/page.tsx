"use client";

import { useState, useCallback, useMemo } from "react";
import { Download, Printer, RotateCcw, ChevronRight } from "lucide-react";

import StepIndicator from "@/app/components/StepIndicator";
import UploadZone from "@/app/components/UploadZone";
import RateConfig from "@/app/components/RateConfig";
import SummaryCards from "@/app/components/SummaryCards";
import PayrollTable from "@/app/components/PayrollTable";

import type { Employee, PayrollConfig, Step } from "@/app/types";
import { calculateAll, getSummary, exportToCSV } from "@/app/lib/payroll";
import Footer from "./components/Footer";
import Nav from "./components/Nav";

const DEFAULT_CONFIG: PayrollConfig = {
  defaultRateDay: 500,
  defaultRateHour: 62.5,
  otMultiplier: 1.25,
  periodLabel: "Current Period",
};

export default function HomePage() {
  const [step, setStep] = useState<Step>(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [config, setConfig] = useState<PayrollConfig>(DEFAULT_CONFIG);
  const [period, setPeriod] = useState("Current Period");

  // Calculate payroll whenever employees or config changes
  const calculated = useMemo(
    () => calculateAll(employees, config),
    [employees, config],
  );
  const summary = useMemo(() => getSummary(calculated), [calculated]);

  const handleParsed = useCallback((emps: Employee[], per: string) => {
    setEmployees(emps);
    setPeriod(per);
    setConfig((c) => ({ ...c, periodLabel: per }));
    setStep(2);
  }, []);

  const handleUpdateEmployee = useCallback(
    (id: number, patch: Partial<Employee>) => {
      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    },
    [],
  );

  function handleReset() {
    setEmployees([]);
    setConfig(DEFAULT_CONFIG);
    setPeriod("Current Period");
    setStep(1);
  }

  return (
    <div className="min-h-screen bg-apple-snow">
      {/* ── Nav ─────────────────────────────────────── */}
      <Nav step={step} handleReset={handleReset} />

      {/* ── Steps mobile ─────────────────────────── */}
      <div className="md:hidden border-b border-apple-mist bg-white px-5 py-3">
        <StepIndicator current={step} />
      </div>

      {/* ── Main ─────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* ── STEP 1: Upload ───────────────────── */}
        <section
          className="animate-fade-up"
          style={{ animationFillMode: "both" }}
        >
          <div className="bg-white rounded-3xl border border-apple-mist shadow-apple-xs overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-apple-mist flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xs font-mono font-semibold text-apple-steel uppercase tracking-widest">
                    Step 1
                  </span>
                  {step > 1 && (
                    <span className="text-2xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      Complete
                    </span>
                  )}
                </div>
                <h2 className="text-[22px] font-bold text-apple-charcoal tracking-tight">
                  Upload Attendance Report
                </h2>
                <p className="text-sm text-apple-smoke mt-1">
                  Export from your biometric system as XLS, XLSX, or CSV.
                </p>
              </div>
            </div>

            <div
              className={`px-5 sm:px-8 py-6 sm:py-8 transition-opacity duration-300 ${step > 1 ? "opacity-50 pointer-events-none" : ""}`}
            >
              <UploadZone onParsed={handleParsed} />
            </div>
          </div>
        </section>

        {/* ── STEP 2: Rates + Table ────────────── */}
        {step >= 2 && (
          <>
            <section
              className="animate-fade-up"
              style={{ animationFillMode: "both", animationDelay: "40ms" }}
            >
              <div className="bg-white rounded-3xl border border-apple-mist shadow-apple-xs overflow-hidden">
                <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-apple-mist">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xs font-mono font-semibold text-apple-steel uppercase tracking-widest">
                      Step 2
                    </span>
                    <span className="text-2xs font-semibold text-apple-smoke bg-apple-snow px-2 py-0.5 rounded-full border border-apple-mist">
                      {period}
                    </span>
                  </div>
                  <h2 className="text-[22px] font-bold text-apple-charcoal tracking-tight">
                    Configure Pay Rates
                  </h2>
                  <p className="text-sm text-apple-smoke mt-1">
                    Set default rates. Override per employee in the table.
                  </p>
                </div>
                <div className="px-5 sm:px-8 py-6 sm:py-8">
                  <RateConfig config={config} onChange={setConfig} />
                </div>
              </div>
            </section>

            {/* Summary */}
            <section
              className="animate-fade-up"
              style={{ animationFillMode: "both", animationDelay: "80ms" }}
            >
              <SummaryCards summary={summary} period={period} />
            </section>

            {/* Table */}
            <section
              className="animate-fade-up"
              style={{ animationFillMode: "both", animationDelay: "120ms" }}
            >
              <div className="bg-white rounded-3xl border border-apple-mist shadow-apple-xs overflow-hidden">
                <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-apple-mist flex items-center justify-between flex-wrap gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xs font-mono font-semibold text-apple-steel uppercase tracking-widest">
                        Step 3
                      </span>
                    </div>
                    <h2 className="text-[22px] font-bold text-apple-charcoal tracking-tight">
                      Employee Payroll Details
                    </h2>
                    <p className="text-sm text-apple-smoke mt-1">
                      Edit hours inline. All totals update in real time.
                    </p>
                  </div>

                  {/* Export actions */}
                  <div className="flex items-center gap-2 no-print w-full sm:w-auto">
                    <button
                      onClick={() => exportToCSV(calculated, period)}
                      className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 rounded-2xl
                        bg-apple-charcoal text-white text-sm font-semibold
                        hover:bg-apple-black transition-all duration-150 active:scale-[0.98]
                        shadow-apple"
                    >
                      <Download size={14} />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="px-5 sm:px-8 py-6 sm:py-8">
                  <PayrollTable
                    employees={employees}
                    calculated={calculated}
                    config={config}
                    onUpdateEmployee={handleUpdateEmployee}
                  />
                </div>
              </div>
            </section>

            {/* Proceed button */}
            <div className="flex justify-end pb-4 no-print">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl
                  bg-apple-charcoal text-white text-sm font-semibold
                  hover:bg-apple-black transition-all duration-150 active:scale-[0.98]
                  shadow-apple-lg"
              >
                Finalise Payroll
                <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <Footer />
    </div>
  );
}
