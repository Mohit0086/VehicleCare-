/**
 * PDF Invoice Generator Utility
 * Implements SRS FR-27 (Download invoice as PDF).
 */

let PDFDocument = null;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  // PDFKit will be used once npm install is run
}

function generateInvoicePdf({ bill, booking, items, serviceCenter, vehicle, user }) {
  if (!PDFDocument) {
    const rawPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 250 >> stream
BT
/F1 20 Tf
50 720 Td
(VEHICLECARE - TAX INVOICE) Tj
/F1 12 Tf
0 -30 Td
(Invoice No: ${bill.bill_no || 'VC-0001'}) Tj
0 -20 Td
(Date: ${new Date(bill.generated_at || Date.now()).toLocaleDateString('en-IN')}) Tj
0 -20 Td
(Vehicle: ${vehicle?.brand || ''} ${vehicle?.model || ''} - ${vehicle?.reg_no || ''}) Tj
0 -20 Td
(Total Amount: Rs. ${bill.total_amount || 0}) Tj
0 -20 Td
(Payment Status: ${bill.payment_status || 'PAID'} / Mode: ${bill.payment_mode || 'CASH'}) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000544 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
615
%%EOF`;
    return Promise.resolve(Buffer.from(rawPdf, 'utf-8'));
  }
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: 'A4' });
      const buffers = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 1. Header Banner
      doc.rect(45, 45, 505, 55).fill('#1e3a8a');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('VEHICLECARE', 60, 57);
      doc.fontSize(9).font('Helvetica').text('Smart Vehicle Maintenance & Service Management', 60, 80);
      doc.fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 420, 65, { align: 'right' });

      doc.moveDown(2);

      // 2. Invoice & Center Details
      const metaY = 120;
      doc.fillColor('#334155').fontSize(9).font('Helvetica');

      // Left Column: Workshop Details
      doc.font('Helvetica-Bold').fontSize(11).text(serviceCenter.name || 'QuickFix Auto Care', 45, metaY);
      doc.font('Helvetica').fontSize(9).fillColor('#64748b');
      doc.text(serviceCenter.address || 'Workshop Address', 45, metaY + 16);
      doc.text(`${serviceCenter.city || ''} | Phone: ${serviceCenter.phone || ''}`, 45, metaY + 28);

      // Right Column: Invoice Metadata
      const rightX = 330;
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(9);
      doc.text(`Invoice No:`, rightX, metaY);
      doc.font('Helvetica').text(bill.bill_no, rightX + 80, metaY);

      doc.font('Helvetica-Bold').text(`Date:`, rightX, metaY + 14);
      doc.font('Helvetica').text(new Date(bill.generated_at || Date.now()).toLocaleDateString('en-IN'), rightX + 80, metaY + 14);

      doc.font('Helvetica-Bold').text(`Payment:`, rightX, metaY + 28);
      doc.font('Helvetica').text(`${bill.payment_status || 'PAID'} (${bill.payment_mode || 'CASH'})`, rightX + 80, metaY + 28);

      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(45, 175).lineTo(550, 175).stroke();

      // 3. Customer & Vehicle Box
      const infoBoxY = 185;
      doc.rect(45, infoBoxY, 505, 60).fill('#f8fafc').stroke('#e2e8f0');

      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9).text('BILLED TO:', 55, infoBoxY + 8);
      doc.font('Helvetica').text(`${user.name || 'Vehicle Owner'} (${user.email || ''})`, 55, infoBoxY + 20);
      doc.text(`Phone: ${user.phone || 'N/A'}`, 55, infoBoxY + 32);

      doc.font('Helvetica-Bold').text('VEHICLE DETAILS:', 310, infoBoxY + 8);
      doc.font('Helvetica').text(`${vehicle.brand} ${vehicle.model} (${vehicle.year}) · ${vehicle.fuel_type}`, 310, infoBoxY + 20);
      doc.font('Helvetica-Bold').text(`Registration: ${vehicle.reg_no}`, 310, infoBoxY + 32);
      if (booking.odometer_at_service) {
        doc.font('Helvetica').text(`Odometer at Service: ${Number(booking.odometer_at_service).toLocaleString('en-IN')} km`, 310, infoBoxY + 44);
      }

      // 4. Line Items Table
      let tableY = 265;
      doc.rect(45, tableY, 505, 22).fill('#2563eb');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
      doc.text('#', 55, tableY + 6);
      doc.text('Type', 80, tableY + 6);
      doc.text('Description / Part Name', 140, tableY + 6);
      doc.text('Qty', 370, tableY + 6, { align: 'right' });
      doc.text('Rate (₹)', 440, tableY + 6, { align: 'right' });
      doc.text('Total (₹)', 530, tableY + 6, { align: 'right' });

      tableY += 24;
      doc.fillColor('#334155').font('Helvetica').fontSize(9);

      let subtotalSum = 0;
      items.forEach((item, index) => {
        const qty = parseFloat(item.quantity) || 1;
        const rate = parseFloat(item.unit_price) || 0;
        const total = parseFloat(item.subtotal) || (qty * rate);
        subtotalSum += total;

        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(45, tableY, 505, 20).fill(rowBg);

        doc.fillColor('#1e293b');
        doc.text(String(index + 1), 55, tableY + 5);
        doc.text(item.item_type || 'PART', 80, tableY + 5);
        doc.text(item.description || 'Line Item', 140, tableY + 5);
        doc.text(qty.toFixed(2), 370, tableY + 5, { align: 'right' });
        doc.text(rate.toFixed(2), 440, tableY + 5, { align: 'right' });
        doc.font('Helvetica-Bold').text(total.toFixed(2), 530, tableY + 5, { align: 'right' });
        doc.font('Helvetica');

        tableY += 20;
      });

      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(45, tableY).lineTo(550, tableY).stroke();

      // 5. Total Summary
      tableY += 10;
      doc.rect(330, tableY, 220, 50).fill('#f1f5f9');
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11);
      doc.text('Grand Total:', 340, tableY + 18);
      const grandTotal = parseFloat(bill.total_amount) || subtotalSum;
      doc.fontSize(14).fillColor('#1d4ed8').text(`₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 430, tableY + 16, { align: 'right' });

      // 6. Signatures and Notes
      const footerY = 680;
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(45, footerY).lineTo(550, footerY).stroke();

      doc.fillColor('#64748b').fontSize(8).font('Helvetica');
      doc.text('Terms: All parts and labour carry standard workshop warranty. This is an electronically generated invoice.', 45, footerY + 10);
      doc.text('VehicleCare — Developed at SISTec Bhopal (RGPV)', 45, footerY + 22);

      doc.text('Authorized Workshop Signatory', 410, footerY + 45, { align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateInvoicePdf,
};
