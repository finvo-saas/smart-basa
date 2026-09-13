import { jsPDF } from 'jspdf'
import type { Booking, BookingFeeBreakdown, Hotel, Room } from '@/types/hotel'
import { downloadHtml, printHtml, sanitizeFilename } from './file'

export interface HotelInvoiceData {
  hotel: Hotel
  room: Room
  booking: Booking
  fees: BookingFeeBreakdown
  guestName: string
  guestPhone: string
  guestEmail?: string
}

function money(n: number) {
  return `BDT ${n.toLocaleString('en-BD')}`
}

export function buildHotelInvoiceHtml(data: HotelInvoiceData): string {
  const { hotel, room, booking, fees, guestName, guestPhone, guestEmail } = data
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Invoice · ${hotel.name}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;color:#0f172a}
h1{font-size:20px;margin:0} .muted{color:#64748b;font-size:13px}
table{width:100%;border-collapse:collapse;margin-top:16px}
td,th{padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}
.amount{text-align:right} .total{font-weight:700;font-size:16px}
@media print{body{margin:0}}
</style></head><body>
<h1>${hotel.name}</h1>
<p class="muted">Tax invoice / booking receipt · ${hotel.address}, ${hotel.area}, ${hotel.city}</p>
<p class="muted">Status: ${booking.paymentStatus}</p>
<p><strong>Guest:</strong> ${guestName}<br/>
<strong>Phone:</strong> ${guestPhone}${guestEmail ? `<br/><strong>Email:</strong> ${guestEmail}` : ''}</p>
<p><strong>Room:</strong> ${room.roomNumber} (${room.type})<br/>
<strong>Check-in:</strong> ${booking.checkIn} · <strong>Check-out:</strong> ${booking.checkOut}<br/>
<strong>Nights:</strong> ${fees.nights} · <strong>Guests:</strong> ${booking.guests}</p>
<table>
<tr><th>Description</th><th class="amount">Amount</th></tr>
<tr><td>Room (${fees.nights} nights)</td><td class="amount">৳${fees.baseRoomTotal.toLocaleString()}</td></tr>
${fees.weekendSurcharge ? `<tr><td>Weekend surcharge</td><td class="amount">৳${fees.weekendSurcharge.toLocaleString()}</td></tr>` : ''}
${fees.seasonalSurcharge ? `<tr><td>Seasonal surcharge</td><td class="amount">৳${fees.seasonalSurcharge.toLocaleString()}</td></tr>` : ''}
<tr><td>Service charge</td><td class="amount">৳${fees.serviceCharge.toLocaleString()}</td></tr>
<tr><td>VAT</td><td class="amount">৳${fees.vat.toLocaleString()}</td></tr>
<tr class="total"><td>Total</td><td class="amount">৳${fees.total.toLocaleString()}</td></tr>
<tr><td>Advance paid (${fees.advancePercent}%)</td><td class="amount">৳${fees.advanceAmount.toLocaleString()}</td></tr>
<tr><td>Balance at hotel</td><td class="amount">৳${fees.remainingAmount.toLocaleString()}</td></tr>
</table>
<p class="muted">Payment: ${booking.paymentMethod || '—'} · Txn: ${booking.transactionId || '—'}</p>
<p class="muted">Generated ${new Date().toLocaleString('en-GB')} · SmartBasa</p>
</body></html>`
}

export function buildHotelInvoicePdfBlob(data: HotelInvoiceData): Blob {
  const { hotel, room, booking, fees, guestName, guestPhone } = data
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 18
  const m = 16
  const w = doc.internal.pageSize.getWidth()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(hotel.name, m, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Invoice · ${hotel.name}`, m, y)
  doc.text(booking.paymentStatus.toUpperCase(), w - m, y, { align: 'right' })
  doc.setTextColor(0)
  y += 10

  doc.setFontSize(11)
  doc.text(`Guest: ${guestName}`, m, y)
  y += 6
  doc.text(`Phone: ${guestPhone}`, m, y)
  y += 6
  doc.text(`Room ${room.roomNumber} (${room.type})`, m, y)
  y += 6
  doc.text(`${booking.checkIn} → ${booking.checkOut} (${fees.nights} nights)`, m, y)
  y += 10

  const rows: [string, number][] = [
    [`Room (${fees.nights} nights)`, fees.baseRoomTotal],
    ['Weekend surcharge', fees.weekendSurcharge],
    ['Seasonal surcharge', fees.seasonalSurcharge],
    ['Service charge', fees.serviceCharge],
    ['VAT', fees.vat],
  ]
  for (const [label, amount] of rows) {
    if (amount <= 0 && label.includes('surcharge')) continue
    doc.text(label, m, y)
    doc.text(money(amount), w - m, y, { align: 'right' })
    y += 6
  }
  y += 2
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', m, y)
  doc.text(money(fees.total), w - m, y, { align: 'right' })
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text(`Advance paid: ${money(fees.advanceAmount)}`, m, y)
  y += 6
  doc.text(`Balance at hotel: ${money(fees.remainingAmount)}`, m, y)
  y += 10
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Txn: ${booking.transactionId || '—'} · ${booking.paymentMethod || ''}`, m, y)

  return doc.output('blob')
}

export function openHotelInvoicePdf(data: HotelInvoiceData): void {
  if (typeof window === 'undefined') return
  const blob = buildHotelInvoicePdfBlob(data)
  const url = URL.createObjectURL(blob)
  const tab = window.open(url, '_blank', 'noopener,noreferrer')
  if (!tab) {
    const a = document.createElement('a')
    a.href = url
    a.download = sanitizeFilename(
      `Invoice_${data.hotel.name}_${data.booking.checkIn}.pdf`,
    )
    a.click()
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function downloadHotelInvoiceHtml(data: HotelInvoiceData): void {
  downloadHtml(
    buildHotelInvoiceHtml(data),
    sanitizeFilename(`Invoice_${data.hotel.name}_${data.booking.checkIn}.html`)
  )
}

export function printHotelInvoice(data: HotelInvoiceData): void {
  printHtml(
    buildHotelInvoiceHtml(data),
    `Invoice_${data.hotel.name}_${data.booking.checkIn}`,
  )
}
