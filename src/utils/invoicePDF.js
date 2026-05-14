import jsPDF from 'jspdf';

/**
 * generateInvoicePDF
 * Generates a professional GST invoice PDF and triggers download.
 * @param {Object} txn - Transaction object
 * @param {Object} settings - Business settings from context
 */
export function generateInvoicePDF(txn, settings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const cur = settings.currency || 'Rs.';
  const W = 210;
  const margin = 14;
  let y = 14;

  const line = () => { doc.setDrawColor(220, 220, 220); doc.line(margin, y, W - margin, y); y += 4; };
  const text = (str, x, size = 10, bold = false, color = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(String(str), x, y);
  };

  // ── Header ───────────────────────────────────────────────────────────────
  doc.setFillColor(7, 10, 20);
  doc.rect(0, 0, W, 38, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 200, 240);
  doc.text(settings.businessName || 'My Business', margin, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 160, 180);
  if (settings.address) doc.text(settings.address, margin, 22);
  if (settings.phone)   doc.text(`Phone: ${settings.phone}`, margin, 27);
  if (settings.email)   doc.text(`Email: ${settings.email}`, margin, 32);

  // TAX INVOICE label
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', W - margin, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 160, 180);
  doc.text(`Invoice #: INV-${String(txn.id || Date.now()).slice(-6)}`, W - margin, 24, { align: 'right' });
  doc.text(`Date: ${txn.date || new Date().toLocaleDateString()}`, W - margin, 29, { align: 'right' });

  y = 46;

  // ── Customer Info ────────────────────────────────────────────────────────
  if (txn.customerName) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(txn.customerName, margin, y); y += 5;
    if (txn.customerPhone) { doc.text(txn.customerPhone, margin, y); y += 5; }
  }

  y += 2;

  // ── Items Table ──────────────────────────────────────────────────────────
  // Header row
  doc.setFillColor(240, 242, 245);
  doc.rect(margin, y - 4, W - margin * 2, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('#', margin + 2, y);
  doc.text('Product', margin + 10, y);
  doc.text('Qty', W - 70, y, { align: 'right' });
  doc.text('Rate', W - 50, y, { align: 'right' });
  doc.text('Amount', W - margin, y, { align: 'right' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  const items = txn.items || [];
  items.forEach((item, i) => {
    const amount = (item.price || 0) * (item.qty || 0);
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 254);
      doc.rect(margin, y - 4, W - margin * 2, 7, 'F');
    }
    doc.setFontSize(9);
    doc.text(String(i + 1), margin + 2, y);
    doc.text(String(item.name || '').slice(0, 35), margin + 10, y);
    doc.text(String(item.qty || 0), W - 70, y, { align: 'right' });
    doc.text(`${cur} ${(item.price || 0).toLocaleString()}`, W - 50, y, { align: 'right' });
    doc.text(`${cur} ${amount.toLocaleString()}`, W - margin, y, { align: 'right' });
    y += 7;
  });

  y += 3;
  doc.setDrawColor(200, 200, 210);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // ── Totals ───────────────────────────────────────────────────────────────
  const colL = W - 70;
  const colR = W - margin;
  const totRow = (label, val, bold = false, color = [40, 40, 40]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(...color);
    doc.text(label, colL, y, { align: 'right' });
    doc.text(val, colR, y, { align: 'right' });
    y += 6;
  };

  totRow('Subtotal:', `${cur} ${(txn.subtotal || txn.total || 0).toLocaleString()}`);
  if ((txn.discount || 0) > 0) totRow('Discount:', `- ${cur} ${(txn.discount || 0).toLocaleString()}`, false, [16, 185, 129]);
  if ((txn.tax || 0) > 0)      totRow(`GST / Tax (${settings.taxRate || 0}%):`, `${cur} ${(txn.tax || 0).toLocaleString()}`, false, [245, 158, 11]);

  // total box
  doc.setFillColor(7, 10, 20);
  doc.roundedRect(colL - 30, y - 5, W - colL + 30 + margin, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 200, 240);
  doc.text('TOTAL:', colL, y + 3, { align: 'right' });
  doc.text(`${cur} ${(txn.total || 0).toLocaleString()}`, colR, y + 3, { align: 'right' });
  y += 16;

  // ── Payment Info ─────────────────────────────────────────────────────────
  const pays = txn.payments || [{ method: txn.paymentMethod || 'Cash', amount: txn.total }];
  if (pays.length > 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
    doc.text('Payment:', margin, y); y += 5;
    doc.setFont('helvetica', 'normal');
    pays.forEach(p => {
      doc.text(`${String(p.method).charAt(0).toUpperCase() + String(p.method).slice(1)}: ${cur} ${(p.amount || 0).toLocaleString()}`, margin + 4, y);
      y += 5;
    });
  }

  // ── Bank Details ─────────────────────────────────────────────────────────
  if (settings.bankDetails?.account) {
    y += 4;
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
    doc.text('Bank Details:', margin, y); y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.bankDetails.name || ''} | A/C: ${settings.bankDetails.account} | ${settings.bankDetails.branch || ''}`, margin + 4, y);
    y += 6;
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  y += 4;
  doc.setDrawColor(200, 200, 210); doc.line(margin, y, W - margin, y); y += 6;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 140);
  const footer = settings.receiptFooter || 'Thank you for your business!';
  doc.text(footer, W / 2, y, { align: 'center' }); y += 6;
  doc.setFontSize(7); doc.setTextColor(160, 160, 170);
  doc.text('Developed By Nazeer Ahmad · BusinessOS v2.0', W / 2, y, { align: 'center' });

  // ── Save ─────────────────────────────────────────────────────────────────
  doc.save(`Invoice-INV-${String(txn.id || Date.now()).slice(-6)}.pdf`);
}
