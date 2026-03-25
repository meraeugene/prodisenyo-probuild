"use client";

import { RotateCcw } from "lucide-react";
import StepIndicator from "./StepIndicator";
import { Step } from "@/types";

interface NavProps {
  step: Step;
  handleReset: () => void;
}
const Nav = ({ step, handleReset }: NavProps) => {

  return (
    <nav className="sticky top-0 z-50 bg-apple-white/80 backdrop-blur-xl border-b border-apple-mist">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-1 leading-none justify-self-start">
            <span className="text-base font-black tracking-wide text-apple-charcoal">
              PRODISENYO
            </span>

            <div className="flex items-center gap-2 -mt-1">
              <div className="h-[1px] w-6 bg-gradient-to-r from-transparent via-apple-steel to-apple-steel"></div>
              <span className="text-[8px] tracking-[0.10em] text-apple-smoke whitespace-nowrap">
                PAYROLL SYSTEM
              </span>
              <div className="h-[1px] w-6 bg-gradient-to-l from-transparent via-apple-steel to-apple-steel"></div>
            </div>
          </div>

          <div className="hidden md:block justify-self-center">
            <StepIndicator current={step} />
          </div>

          <div className="flex items-center gap-2 justify-self-end">
            {step >= 2 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-apple-silver text-xs font-semibold text-apple-ash hover:border-apple-ash transition-all"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
