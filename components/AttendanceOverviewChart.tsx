"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import type { AttendanceRecord } from "@/types";

declare global {
  interface Window {
    Chart: any;
  }
}

function formatShortDate(isoDate: string) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
  });
}

export default function AttendanceOverviewChart({
  records,
  employeeCount,
}: {
  records: AttendanceRecord[];
  employeeCount: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const chartData = useMemo(() => {
    const perDate = new Map<string, Set<string>>();

    records.forEach((record) => {
      const employees = perDate.get(record.date) ?? new Set<string>();
      employees.add(record.employee.trim().toLowerCase());
      perDate.set(record.date, employees);
    });

    const rows = Array.from(perDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([date, employees]) => {
        const present = employees.size;
        const exceptions = Math.max(0, employeeCount - present);

        return {
          label: formatShortDate(date),
          present,
          exceptions: exceptions > 0 ? -exceptions : 0,
        };
      });

    return {
      labels: rows.map((row) => row.label),
      present: rows.map((row) => row.present),
      exceptions: rows.map((row) => row.exceptions),
    };
  }, [employeeCount, records]);

  useEffect(() => {
    if (!ready || !canvasRef.current || !window.Chart) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const positiveMax =
      chartData.present.length > 0
        ? Math.max(...chartData.present, employeeCount, 1)
        : Math.max(employeeCount, 1);
    const negativeMax =
      chartData.exceptions.length > 0
        ? Math.max(...chartData.exceptions.map((value) => Math.abs(value)), 1)
        : 1;

    chartRef.current = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "Present",
            data: chartData.present,
            backgroundColor: "rgba(37, 113, 58, 0.95)",
            borderRadius: 999,
            borderSkipped: false,
            maxBarThickness: 14,
          },
          {
            label: "Exceptions",
            data: chartData.exceptions,
            backgroundColor: "rgba(147, 212, 163, 0.95)",
            borderRadius: 999,
            borderSkipped: false,
            maxBarThickness: 14,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#163b21",
            titleColor: "#ffffff",
            bodyColor: "#dff2e4",
            padding: 12,
            displayColors: true,
          },
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            border: { display: false },
            ticks: {
              color: "#6e9e7c",
              font: { family: "DM Sans", size: 11, weight: "500" },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 4,
            },
          },
          y: {
            min: -Math.max(10, negativeMax + 2),
            max: Math.max(10, positiveMax + 4),
            grid: {
              color: "#edf1f3",
              drawBorder: false,
              borderDash: [4, 4],
            },
            border: { display: false },
            ticks: {
              color: "#8cb398",
              font: { family: "DM Sans", size: 10, weight: "500" },
              callback(value: number) {
                return value === 0 ? "0" : `${Math.abs(value)}`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData, employeeCount, ready]);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div className="h-[265px]">
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}
