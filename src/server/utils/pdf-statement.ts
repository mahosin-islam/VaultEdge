// ============================================================================
// VaultEdge — Lightweight Pure-TypeScript PDF 1.4 Statement Generator
// Generates valid downloadable PDF account statements without external libs.
// ============================================================================

function escapePdfText(text: string): string {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

export interface PdfStatementLine {
  date: string;
  referenceId: string;
  type: string;
  direction: string;
  amount: string;
  balanceAfter: string;
}

export function generateAccountStatementPdf(params: {
  accountNumber: string;
  accountTitle: string;
  accountType: string;
  currency: string;
  holderName: string;
  currentBalance: string;
  periodLabel: string;
  entries: PdfStatementLine[];
}): Buffer {
  const lines: string[] = [
    "VAULTEDGE INSTITUTIONAL DIGITAL BANKING — ACCOUNT STATEMENT",
    "==============================================================================",
    `Account Holder : ${params.holderName}`,
    `Account Number : ${params.accountNumber} (${params.accountType})`,
    `Account Title  : ${params.accountTitle}`,
    `Statement Period: ${params.periodLabel}`,
    `Current Balance: ${params.currency} ${params.currentBalance}`,
    "------------------------------------------------------------------------------",
    "DATE       | REFERENCE        | TYPE              | DIR    | AMOUNT     | BAL AFTER",
    "------------------------------------------------------------------------------",
  ];

  const maxRows = 45;
  const rowsToRender = params.entries.slice(0, maxRows);
  if (rowsToRender.length === 0) {
    lines.push("No ledger entries recorded for the selected period.");
  } else {
    for (const row of rowsToRender) {
      const line = `${row.date.slice(0, 10).padEnd(10)} | ${row.referenceId
        .slice(0, 16)
        .padEnd(16)} | ${row.type.slice(0, 17).padEnd(17)} | ${row.direction
        .slice(0, 6)
        .padEnd(6)} | ${row.amount.padStart(10)} | ${row.balanceAfter.padStart(10)}`;
      lines.push(line);
    }
    if (params.entries.length > maxRows) {
      lines.push(`... (${params.entries.length - maxRows} more entries omitted; export CSV for full list)`);
    }
  }

  lines.push("==============================================================================");
  lines.push(`Generated at ${new Date().toISOString()} | VaultEdge Core Ledger`);

  const contentOps: string[] = ["BT", "/F1 9 Tf", "40 760 Td", "13 TL"];
  for (let i = 0; i < lines.length; i++) {
    const escaped = escapePdfText(lines[i]);
    if (i === 0) {
      contentOps.push(`(${escaped}) Tj`);
    } else {
      contentOps.push(`T* (${escaped}) Tj`);
    }
  }
  contentOps.push("ET");

  const streamContent = contentOps.join("\n");
  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${Buffer.byteLength(streamContent, "utf8")} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}
