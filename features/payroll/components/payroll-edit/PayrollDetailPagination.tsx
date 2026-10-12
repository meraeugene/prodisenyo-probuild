"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PayrollPageControls } from "../PayrollPageControls";

const PaginationHostContext = createContext<HTMLDivElement | null>(null);

export function PayrollDetailPaginationHost({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return <PaginationHostContext.Provider value={host}>
    <div className="flex min-h-0 flex-1 flex-col">
      {children}
      <div ref={setHost} className="shrink-0 bg-white" />
    </div>
  </PaginationHostContext.Provider>;
}

export function PayrollDetailPagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (page: number) => void;
}) {
  const host = useContext(PaginationHostContext);
  if (totalPages <= 1) return null;
  const controls = <div className="border-t border-slate-200 bg-white px-3 py-2"><PayrollPageControls page={page} totalPages={totalPages} onChange={onChange} label="Employee detail pages" /></div>;
  return host ? createPortal(controls, host) : controls;
}
