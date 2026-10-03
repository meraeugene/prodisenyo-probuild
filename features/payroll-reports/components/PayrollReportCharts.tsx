"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PayrollReportAnalyticsTooltip } from "./PayrollReportUiBits";
import { PAYROLL_REPORT_SITE_COLORS, buildPayrollReportDailyTrend, buildPayrollReportSiteSummaries, buildPayrollReportSiteDistribution, formatPayrollReportCompactValue, formatPayrollReportPeso } from "../utils/payrollReportHelpers";
export default function PayrollReportCharts({ dailyTrend, siteSummaries, siteDistribution, isMobile }: {
 isMobile: boolean;
 dailyTrend: ReturnType<typeof buildPayrollReportDailyTrend>;
 siteSummaries: ReturnType<typeof buildPayrollReportSiteSummaries>;
 siteDistribution: ReturnType<typeof buildPayrollReportSiteDistribution>;
}) { return (<div className="order-3 space-y-4">
                  <div className="workspace-surface overflow-hidden">
                    <div className="border-b border-apple-mist px-3 py-3 sm:px-4 sm:py-4">
                      <p className="text-[17px] font-semibold tracking-tight text-apple-charcoal">
                        Daily Payroll Trend
                      </p>
                    </div>
                    <div className="h-[320px] px-1 py-3 sm:px-3 sm:py-4">
                      {dailyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={dailyTrend}
                            margin={{ top: 14, right: 10, left: 2, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="payrollReportTrendFill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#076d69"
                                  stopOpacity={0.16}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#076d69"
                                  stopOpacity={0.02}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="0"
                              vertical={false}
                              stroke="#edf3f1"
                            />
                            <XAxis
                              dataKey="label"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#53736f", fontSize: 11 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#53736f", fontSize: 11 }}
                              tickFormatter={(value) =>
                                formatPayrollReportCompactValue(Number(value))
                              }
                            />
                            <Tooltip
                              content={(props) => (
                                <PayrollReportAnalyticsTooltip
                                  {...props}
                                  valueFormatter={(value) =>
                                    formatPayrollReportPeso(value)
                                  }
                                />
                              )}
                            />
                            <Area
                              type="monotone"
                              dataKey="paid"
                              name="Paid"
                              stroke="#076d69"
                              strokeWidth={3.5}
                              fill="url(#payrollReportTrendFill)"
                              dot={false}
                              activeDot={{
                                r: 5,
                                fill: "#076d69",
                                stroke: "white",
                                strokeWidth: 2,
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-apple-steel">
                          No daily totals were saved for this report yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
                    <div className="workspace-surface flex h-full flex-col overflow-hidden">
                      <div className="border-b border-apple-mist px-4 py-4">
                        <p className="text-[17px] font-semibold tracking-tight text-apple-charcoal">
                          Site Payroll Breakdown
                        </p>
                      </div>
                      <div className="h-[320px] rounded-[12px] bg-[rgb(var(--apple-snow))] p-2 sm:p-4">
                        {siteSummaries.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={siteSummaries.slice(0, 6)}
                              barCategoryGap="28%"
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="0"
                                vertical={false}
                                stroke="rgb(var(--theme-chart-grid))"
                              />
                              <XAxis
                                dataKey="siteName"
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                tickFormatter={isMobile ? () => "" : undefined}
                                tick={{
                                  fill: "rgb(var(--theme-chart-axis))",
                                  fontSize: 11,
                                }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                  fill: "rgb(var(--theme-chart-axis))",
                                  fontSize: 11,
                                }}
                                tickFormatter={(value) =>
                                  formatPayrollReportCompactValue(Number(value))
                                }
                              />
                              <Tooltip
                                content={(props) => (
                                  <PayrollReportAnalyticsTooltip
                                    {...props}
                                    valueFormatter={(value) =>
                                      formatPayrollReportPeso(value)
                                    }
                                  />
                                )}
                                cursor={{
                                  fill: "rgb(var(--theme-chart-cursor))",
                                }}
                              />
                              <Bar
                                dataKey="payroll"
                                name="Payroll"
                                radius={[6, 6, 6, 6]}
                                barSize={44}
                              >
                                {siteSummaries
                                  .slice(0, 6)
                                  .map((entry, index) => (
                                    <Cell
                                      key={`${entry.siteName}-${index}`}
                                      fill={
                                        PAYROLL_REPORT_SITE_COLORS[
                                          index %
                                            PAYROLL_REPORT_SITE_COLORS.length
                                        ]
                                      }
                                    />
                                  ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-apple-steel">
                            No site breakdown found.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="workspace-surface flex h-full flex-col overflow-hidden">
                      <div className="border-b border-apple-mist px-4 py-4">
                        <p className="text-[17px] font-semibold tracking-tight text-apple-charcoal">
                          Payroll Distribution Per Site
                        </p>
                      </div>
                      <div className="flex flex-1 px-4 py-4">
                        {siteDistribution.length > 0 ? (
                          <div className="grid h-full min-h-[320px] w-full grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                            <div className="h-[220px] min-h-0 sm:h-[240px] lg:h-full lg:min-h-[320px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={siteDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={58}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    stroke="none"
                                  >
                                    {siteDistribution.map((entry) => (
                                      <Cell
                                        key={entry.name}
                                        fill={entry.color}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={(props) => (
                                      <PayrollReportAnalyticsTooltip
                                        {...props}
                                        valueFormatter={(value) =>
                                          formatPayrollReportPeso(value)
                                        }
                                      />
                                    )}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="min-h-0 pr-1 lg:pr-2">
                              {siteDistribution.map((entry, index) => (
                                <div
                                  key={`${entry.name}-${index}`}
                                  className="flex items-start gap-2 py-1"
                                >
                                  <span
                                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-2xs font-medium text-apple-smoke">
                                      {entry.name}
                                    </p>
                                    <p className="truncate text-sm font-medium text-apple-charcoal">
                                      {formatPayrollReportPeso(entry.value)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-[260px] items-center justify-center text-sm text-apple-steel">
                            No site distribution data found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>); }
