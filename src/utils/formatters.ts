// ============================================================================
// VaultEdge — Pure Financial & Number Formatting Utilities
// ============================================================================

export function formatCurrencyFull(amountStrOrNum: string | number): string {
  const num =
    typeof amountStrOrNum === "number"
      ? amountStrOrNum
      : Number(amountStrOrNum);

  if (!Number.isFinite(num)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatCurrencyCompact(amountStrOrNum: string | number): string {
  const num =
    typeof amountStrOrNum === "number"
      ? amountStrOrNum
      : Number(amountStrOrNum);

  if (!Number.isFinite(num)) {
    return "$0.00";
  }

  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 10_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }

  return formatCurrencyFull(num);
}

export function formatCountCompact(count: number): string {
  if (!Number.isFinite(count)) {
    return "0";
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(2)}M`;
  }
  if (count >= 10_000) {
    return `${(count / 1_000).toFixed(2)}K`;
  }
  return new Intl.NumberFormat("en-US").format(count);
}

export function formatTimeStampHMS(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) {
    return "00:00:00";
  }
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  const ms = String(d.getUTCMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}
