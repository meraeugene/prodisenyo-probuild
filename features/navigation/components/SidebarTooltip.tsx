"use client";

import type { ReactElement } from "react";
import { Tooltip } from "radix-ui";

export default function SidebarTooltip({
  active,
  label,
  children,
}: {
  active: boolean;
  label: string;
  children: ReactElement;
}) {
  if (!active) return children;

  return (
    <Tooltip.Provider delayDuration={180} skipDelayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={10}
            className="z-[100] select-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
          >
            {label}
            <Tooltip.Arrow className="fill-slate-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
