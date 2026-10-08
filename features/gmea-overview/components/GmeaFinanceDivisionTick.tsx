type DivisionTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
};

export default function GmeaFinanceDivisionTick({ x = 0, y = 0, payload }: DivisionTickProps) {
  const projects = payload?.value === "Projects Expenses";
  return (
    <text x={x} y={y + 16} textAnchor="middle" fill="#475569" fontSize={14} fontWeight={500}>
      <tspan x={x}>{projects ? "Projects" : payload?.value}</tspan>
      {projects && <tspan x={x} dy={18}>Expenses</tspan>}
    </text>
  );
}
