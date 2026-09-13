import { jsPDF } from 'jspdf'
import type { Bill } from '@/types/bill'
import { downloadHtml, downloadText, printHtml, sanitizeFilename } from './file'

export type BillDownloadFormat = 'html' | 'text' | 'pdf'
export type BillDownloadMode = 'download' | 'print' | 'open'

export interface BillDownloadOptions {
  /** html = styled receipt; text = plain .txt; pdf = PDF document */
  format?: BillDownloadFormat
  /** download file, print dialog, or open in a new tab (PDF) */
  mode?: BillDownloadMode
  /** Optional org name on the receipt header */
  organizationName?: string
}

function formatMoney(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`
}

/** jsPDF default fonts lack ৳ — use BDT for PDF output */
function formatMoneyPdf(amount: number): string {
  return `BDT ${amount.toLocaleString('en-BD')}`
}

function formatDate(value?: string): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function unitLabel(bill: Bill): string {
  if (bill.flatNumber) return `Flat ${bill.flatNumber}`
  if (bill.seatNumber) return `Seat ${bill.seatNumber}`
  return '—'
}

function statusLabel(status: Bill['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getBillFilename(bill: Bill, ext: string): string {
  const base = `Bill_${bill.propertyName}_${bill.month}_${bill.year}`
  return `${sanitizeFilename(base)}.${ext}`
}

/** Plain-text receipt — useful for SMS/email paste or lightweight download. */
export function buildBillReceiptText(
  bill: Bill,
  organizationName = 'SmartBasa'
): string {
  const lines: string[] = [
    organizationName,
    'BILL / RENT RECEIPT',
    '========================================',
    `Period: ${bill.month} ${bill.year}`,
    `Status: ${statusLabel(bill.status)}`,
    '',
    `Tenant: ${bill.tenantName}`,
    `Property: ${bill.propertyName}`,
    `Unit: ${unitLabel(bill)}`,
    `Type: ${bill.propertyType}`,
    '',
    `Due date: ${formatDate(bill.dueDate)}`,
    `Paid date: ${formatDate(bill.paidDate)}`,
    '',
    'Items',
    '----------------------------------------',
  ]

  for (const item of bill.items) {
    lines.push(`${item.description.padEnd(28)} ${formatMoney(item.amount)}`)
    if (
      item.calculationType === 'meter-based' &&
      item.consumption !== undefined
    ) {
      lines.push(
        `  (${item.previousReading ?? '?'} → ${item.currentReading ?? '?'} = ${item.consumption} units × ৳${item.unitRate ?? 0})`
      )
    }
  }

  lines.push('----------------------------------------')
  lines.push(`TOTAL${' '.repeat(23)}${formatMoney(bill.amount)}`)
  lines.push('')
  lines.push(`Generated: ${new Date().toLocaleString('en-GB')}`)
  lines.push('Thank you for using SmartBasa.')
  lines.push('This is a computer-generated receipt.')

  return lines.join('\n')
}

/** Styled HTML receipt for download or print-to-PDF. */
export function buildBillReceiptHtml(
  bill: Bill,
  organizationName = 'SmartBasa'
): string {
  const itemRows = bill.items
    .map(item => {
      const detail =
        item.calculationType === 'meter-based' &&
        item.consumption !== undefined
          ? `<div class="item-detail">${item.previousReading ?? '—'} → ${item.currentReading ?? '—'} = ${item.consumption} units${item.unitRate != null ? ` × ৳${item.unitRate}` : ''}</div>`
          : ''
      return `<tr>
        <td>
          <div class="item-name">${escapeHtml(item.description)}</div>
          ${detail}
        </td>
        <td class="amount">${formatMoney(item.amount)}</td>
      </tr>`
    })
    .join('')

  const statusClass =
    bill.status === 'paid'
      ? 'status-paid'
      : bill.status === 'overdue'
        ? 'status-overdue'
        : 'status-unpaid'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bill ${escapeHtml(bill.month)} ${bill.year} — ${escapeHtml(bill.tenantName)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
    }
    .receipt {
      max-width: 720px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand { font-size: 20px; font-weight: 700; }
    .brand span { display: block; font-size: 12px; font-weight: 500; color: #64748b; margin-top: 4px; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-unpaid { background: #fef9c3; color: #854d0e; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .meta { color: #64748b; font-size: 13px; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      margin: 20px 0;
      font-size: 14px;
    }
    .label { color: #64748b; font-size: 12px; margin-bottom: 2px; }
    .value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th {
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 0;
    }
    td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; font-size: 14px; }
    td.amount, th.amount { text-align: right; white-space: nowrap; }
    .item-name { font-weight: 500; }
    .item-detail { font-size: 12px; color: #64748b; margin-top: 2px; }
    .total-row td {
      border-bottom: none;
      padding-top: 16px;
      font-size: 16px;
      font-weight: 700;
    }
    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
      font-size: 12px;
      color: #64748b;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border: none; border-radius: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="brand">
        ${escapeHtml(organizationName)}
        <span>Bangladesh · Rent &amp; utility billing</span>
      </div>
      <div style="text-align:right">
        <div class="badge ${statusClass}">${statusLabel(bill.status)}</div>
      </div>
    </div>

    <h1>Bill / Rent Receipt</h1>
    <p class="meta">Period: ${escapeHtml(bill.month)} ${bill.year}</p>

    <div class="grid">
      <div>
        <div class="label">Tenant</div>
        <div class="value">${escapeHtml(bill.tenantName)}</div>
      </div>
      <div>
        <div class="label">Property</div>
        <div class="value">${escapeHtml(bill.propertyName)}</div>
      </div>
      <div>
        <div class="label">Unit</div>
        <div class="value">${escapeHtml(unitLabel(bill))}</div>
      </div>
      <div>
        <div class="label">Property type</div>
        <div class="value" style="text-transform:capitalize">${escapeHtml(bill.propertyType)}</div>
      </div>
      <div>
        <div class="label">Due date</div>
        <div class="value">${formatDate(bill.dueDate)}</div>
      </div>
      <div>
        <div class="label">Paid date</div>
        <div class="value">${formatDate(bill.paidDate)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="total-row">
          <td>Total</td>
          <td class="amount">${formatMoney(bill.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div>Generated on ${escapeHtml(new Date().toLocaleString('en-GB'))}</div>
      <div>This is a computer-generated receipt from ${escapeHtml(organizationName)}.</div>
      <div>Tip: use your browser Print dialog and choose “Save as PDF” for a PDF copy.</div>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Build a PDF receipt blob (opens cleanly in a new browser tab). */
export function buildBillReceiptPdfBlob(
  bill: Bill,
  organizationName = 'SmartBasa'
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16
  let y = 18

  const line = (text: string, x = margin, size = 11, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.text(text, x, y)
  }

  // Header
  line(organizationName, margin, 16, 'bold')
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('Bangladesh  |  Rent & utility billing', margin, y + 6)
  doc.setTextColor(0)

  const status = statusLabel(bill.status)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(status.toUpperCase(), pageWidth - margin, y, { align: 'right' })
  doc.setTextColor(0)

  y += 16
  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  line('Bill / Rent Receipt', margin, 14, 'bold')
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80)
  doc.text(`Period: ${bill.month} ${bill.year}`, margin, y)
  doc.setTextColor(0)
  y += 10

  const meta: [string, string][] = [
    ['Tenant', bill.tenantName],
    ['Property', bill.propertyName],
    ['Unit', unitLabel(bill)],
    ['Type', bill.propertyType],
    ['Due date', formatDate(bill.dueDate)],
    ['Paid date', formatDate(bill.paidDate)],
  ]

  const col2 = pageWidth / 2 + 4
  meta.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? margin : col2
    if (i % 2 === 0 && i > 0) y += 10
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(label, col, y)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(value, col, y + 5)
    doc.setFont('helvetica', 'normal')
  })
  y += 14

  // Items table header
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text('DESCRIPTION', margin + 1, y + 1)
  doc.text('AMOUNT', pageWidth - margin - 1, y + 1, { align: 'right' })
  doc.setTextColor(0)
  y += 10

  for (const item of bill.items) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(item.description, pageWidth - margin * 2 - 40)
    doc.text(descLines, margin, y)
    doc.setFont('helvetica', 'bold')
    doc.text(formatMoneyPdf(item.amount), pageWidth - margin, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += Math.max(7, descLines.length * 5)

    if (
      item.calculationType === 'meter-based' &&
      item.consumption !== undefined
    ) {
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(
        `${item.previousReading ?? '—'} -> ${item.currentReading ?? '—'} = ${item.consumption} units x BDT ${item.unitRate ?? 0}`,
        margin + 2,
        y
      )
      doc.setTextColor(0)
      y += 6
    }
  }

  y += 4
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('TOTAL', margin, y)
  doc.text(formatMoneyPdf(bill.amount), pageWidth - margin, y, { align: 'right' })

  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, margin, y)
  y += 5
  doc.text(
    `Computer-generated receipt from ${organizationName}.`,
    margin,
    y
  )

  return doc.output('blob')
}

/** Open the bill PDF in a new browser tab (viewer can save/download from there). */
export function openBillPdfInNewTab(
  bill: Bill,
  organizationName = 'SmartBasa'
): void {
  if (typeof window === 'undefined') return

  const blob = buildBillReceiptPdfBlob(bill, organizationName)
  const url = URL.createObjectURL(blob)
  const tab = window.open(url, '_blank', 'noopener,noreferrer')

  if (!tab) {
    // Popup blocked — fall back to direct download
    const link = document.createElement('a')
    link.href = url
    link.download = getBillFilename(bill, 'pdf')
    link.click()
  }

  // Keep blob URL alive long enough for the tab to load
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Download, print, or open a bill receipt.
 * - format `html` / `text` → file download
 * - format `pdf` → opens PDF in a new tab
 * - mode `print` → print dialog
 */
export function downloadBill(
  bill: Bill,
  options: BillDownloadOptions = {}
): void {
  const {
    format = 'html',
    mode = 'download',
    organizationName = 'SmartBasa',
  } = options

  if (mode === 'print') {
    printHtml(
      buildBillReceiptHtml(bill, organizationName),
      getBillFilename(bill, 'receipt')
    )
    return
  }

  if (format === 'pdf' || mode === 'open') {
    openBillPdfInNewTab(bill, organizationName)
    return
  }

  if (format === 'text') {
    downloadText(
      buildBillReceiptText(bill, organizationName),
      getBillFilename(bill, 'txt')
    )
    return
  }

  downloadHtml(
    buildBillReceiptHtml(bill, organizationName),
    getBillFilename(bill, 'html')
  )
}

/** Open print dialog for the HTML receipt. */
export function printBill(bill: Bill, organizationName?: string): void {
  downloadBill(bill, { mode: 'print', organizationName })
}

/** Open PDF receipt in a new tab. */
export function openBillPdf(bill: Bill, organizationName?: string): void {
  openBillPdfInNewTab(bill, organizationName)
}
