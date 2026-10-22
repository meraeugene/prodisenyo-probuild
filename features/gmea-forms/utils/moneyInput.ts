export function parseMoneyInput(value: string): string | null {
  const plain = value.replace(/,/g, "").trim();
  return /^-?\d*(?:\.\d{0,2})?$/.test(plain) ? plain : null;
}

export function formatMoneyInput(value: string | number, padDecimals = false): string {
  const plain = String(value).replace(/,/g, "");
  if (!plain || plain === "-" || !Number.isFinite(Number(plain))) return plain;
  const normalized = padDecimals ? Number(plain).toFixed(2) : plain;
  const [whole, fraction] = normalized.split(".");
  const grouped = (whole.replace(/^(-?)0+(?=\d)/, "$1") || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

export function moneyInputCaret(display: string, plainOffset: number): number {
  let remaining = plainOffset;
  for (let index = 0; index < display.length; index++) {
    if (!remaining) return index;
    if (display[index] !== ",") remaining--;
  }
  return display.length;
}
