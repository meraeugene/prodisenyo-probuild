type DivisionTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
};

export default function GmeaFinanceDivisionTick({ x = 0, y = 0, payload }: DivisionTickProps) {
  const electronics = payload?.value === "Electronics & Solar";
  return (
    <text x={x} y={y + 16} textAnchor="middle" fill="#475569" fontSize={14} fontWeight={500}>
      <tspan x={x}>{electronics ? "Electronics" : payload?.value}</tspan>
      {electronics && <tspan x={x} dy={18}>&amp; Solar</tspan>}
    </text>
  );
}
