import type { TooltipProps } from "recharts";
import ChartMoneyTooltip from "@/components/ChartMoneyTooltip";
import { formatOverviewMoney } from "../utils/gmeaOverviewSelectors";

export default function GmeaFinanceTooltip({ active, payload, label }: TooltipProps<number, string>) {
  return <ChartMoneyTooltip active={active} payload={payload} label={label} formatValue={formatOverviewMoney} />;
}
