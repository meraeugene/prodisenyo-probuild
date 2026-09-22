import type { CSSProperties } from "react";

export const DEFAULT_PROJECT_COLOR = "#FFFFFF";

export const PROJECT_COLOR_OPTIONS = [
  { label: "Green", value: "#00FF00" },
  { label: "Red", value: "#FF0000" },
  { label: "Black", value: "#000000" },
  { label: "Blue", value: "#0000FF" },
  { label: "Magenta", value: "#FF00FF" },
  { label: "Yellow", value: "#FFFF00" },
  { label: "Purple", value: "#9900FF" },
  { label: "Dark red", value: "#CC0000" },
  { label: "White", value: DEFAULT_PROJECT_COLOR },
] as const;

const WORKBOOK_PROJECT_COLORS: Record<string, string> = {
  MARAMAG: "#00FF00",
  BULUA: "#FF0000",
  BFAR: "#000000",
  "CVH- PABX-FDAS": "#0000FF",
  "CVH-CCTV NETWORK": "#FF00FF",
  "CVH -IP CCTV 2AMP 13 CAMERAS": "#FFFF00",
  "ROYAL CABLE PSA CONDUIT": "#9900FF",
  "WAREHOUSE -CORRALES AVE.": DEFAULT_PROJECT_COLOR,
  "CVH 11 16 CAMERAS ANALOG": DEFAULT_PROJECT_COLOR,
  "FULLYBOOKED KETKAI": "#CC0000",
};

export function workbookColorForProjectTitle(title: string) {
  return WORKBOOK_PROJECT_COLORS[title.trim().toUpperCase()];
}

export function projectColor(project: { color?: string | null }) {
  return /^#[0-9A-F]{6}$/i.test(project.color ?? "")
    ? project.color!.toUpperCase()
    : DEFAULT_PROJECT_COLOR;
}

export function projectContainerStyle(project: { color?: string | null }): CSSProperties {
  const color = projectColor(project);
  return {
    borderColor: "#E2E8F0",
    backgroundColor: color === DEFAULT_PROJECT_COLOR ? "#F8FAFC" : color + "18",
  };
}

export function projectSwatchStyle(color: string): CSSProperties {
  const tint = projectColor({ color });
  return {
    backgroundColor: tint === DEFAULT_PROJECT_COLOR ? "#F1F5F9" : tint + "55",
  };
}

export function contrastTextColor(color: string) {
  const normalized = projectColor({ color }).slice(1);
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 160
    ? "#0F172A"
    : "#FFFFFF";
}
