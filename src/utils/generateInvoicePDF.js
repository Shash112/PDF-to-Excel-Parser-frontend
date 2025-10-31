// utils/pdf/generateInvoicePDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const n = (v, d = 0) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : d;
};

function drawCommonHeader(doc, header = {}, uniqueHsCodes = [], y = 12, pageW = 210, margin = 14) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(header.documentTitle || "INVOICE", margin, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const leftX = margin;
  const rightX = pageW - margin - 80;
  let cy = y + 6;

  // Left column
  const L = [
    ["Buyer:", header.buyer || ""],
    ["Buyer Address:", header.buyerAddress || ""],
  ];
  L.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold"); doc.text(k, leftX, cy);
    doc.setFont("helvetica", "normal"); doc.text(String(v), leftX + 26, cy, { maxWidth: 70 });
    cy += 5;
  });

  // Right column
  let ry = y + 6;
  const R = [
    ["Sales Order No:", header.salesOrderNo || ""],
    ["PO Number:", header.refNo || ""],
    ["Order Date:", header.orderDate || ""],
  ];
  R.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold"); doc.text(k, rightX, ry);
    doc.setFont("helvetica", "normal"); doc.text(String(v), rightX + 28, ry);
    ry += 5;
  });

  const hsLine = uniqueHsCodes.length ? uniqueHsCodes.join(", ") : "—";
  doc.setFont("helvetica", "bold"); doc.text("HS Codes:", leftX, cy);
  doc.setFont("helvetica", "normal"); doc.text(hsLine, leftX + 26, cy, { maxWidth: pageW - margin - (leftX + 26) });
  cy += 4;

  doc.setDrawColor(200);
  doc.line(margin, cy + 3, pageW - margin, cy + 3);

  return cy + 8;
}

const INV_COLS = [
  { header: "SR", dataKey: "sr", cellWidth: 10, halign: "center" },
  { header: "DESCRIPTION", dataKey: "description", cellWidth: 86, halign: "left" },
  { header: "QTY", dataKey: "qty", cellWidth: 14, halign: "center" },
  { header: "UOM", dataKey: "unit", cellWidth: 14, halign: "center" },
  { header: "H.S. CODE", dataKey: "hs", cellWidth: 20, halign: "center" },
  { header: "ORIGIN", dataKey: "origin", cellWidth: 18, halign: "center" },
  { header: "UNIT PRICE / AED", dataKey: "unitPrice", cellWidth: 24, halign: "center" },
  { header: "TOTAL VALUE / AED", dataKey: "totalVal", cellWidth: 24, halign: "center" },
];

function buildINVRows(items = []) {
  return items.map((it, i) => {
    const qty = n(it.qty);
    const rate = n(String(it.rate).toString().replace(/[^\d.]/g, ""));
    const amount = n(String(it.amount).toString().replace(/[^\d.]/g, ""));
    return {
      sr: String(i + 1),
      description: it.description ?? "",
      qty: qty ? qty : "",
      unit: it.unit ?? "",
      hs: it.hsCode ?? "",
      origin: it.origin ?? "UAE",
      unitPrice: rate ? rate.toFixed(2) : "",
      totalVal: amount ? amount.toFixed(2) : "",
    };
  });
}

export function generateInvoicePDF(data) {
  const { header = {}, items = [], totals = {} } = data || {};
  const uniqueHs = Array.from(new Set((items || []).map(i => i.hsCode).filter(Boolean)));
  const totalQty = (items || []).reduce((s, it) => s + n(it.qty), 0);
  const subTotal = n(String(totals?.subTotal).toString().replace(/[^\d.]/g, ""));

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  let y = drawCommonHeader(doc, { ...header, documentTitle: "INVOICE" }, uniqueHs, 12, pageW, margin);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [INV_COLS.map(c => c.header)],
    body: buildINVRows(items).map(r => Object.values(r)),
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [156, 163, 175],
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [0, 0, 0],
      halign: "center",
      lineColor: [156, 163, 175],
      lineWidth: 0.2,
      fontStyle: "bold",
      fontSize: 9,
    },
    columnStyles: INV_COLS.reduce((acc, c, idx) => {
      acc[idx] = { cellWidth: c.cellWidth, halign: c.halign || "center" };
      return acc;
    }, {}),
  });

  y = doc.lastAutoTable.finalY + 4;

  // Totals (like your footer block)
  // Row: "TOTAL VALUE IN AED." + qty + Nos + AED + amount
  const cellH = 7;
  const tableX = margin;
  const tableW = pageW - margin * 2;

  // Header row background
  doc.setFillColor(243, 244, 246);
  doc.rect(tableX, y, tableW, cellH, "F");

  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.setDrawColor(156, 163, 175);

  // Col plan: [label colspan 6], then qty, uom, currency, total
  //const splitW = [0.6, 0.1, 0.1, 0.1, 0.1]; // sums > 1 intentionally; we only need relative steps
  const wLabel = tableW * 0.6;
  const wQty = tableW * 0.1;
  const wUom = tableW * 0.1;
  const wCur = tableW * 0.1;
  const wTot = tableW * 0.1;

  let cx = tableX;
  // Label
  doc.rect(cx, y, wLabel, cellH); // border
  doc.text("TOTAL VALUE IN AED.", cx + wLabel - 2, y + 4.5, { align: "right" });
  cx += wLabel;

  // Qty
  doc.rect(cx, y, wQty, cellH);
  doc.text(totalQty.toFixed(2), cx + wQty / 2, y + 4.5, { align: "center" });
  cx += wQty;

  // UOM
  doc.rect(cx, y, wUom, cellH);
  doc.text("Nos", cx + wUom / 2, y + 4.5, { align: "center" });
  cx += wUom;

  // Currency
  doc.rect(cx, y, wCur, cellH);
  doc.text("AED", cx + wCur / 2, y + 4.5, { align: "center" });
  cx += wCur;

  // Total
  doc.rect(cx, y, wTot, cellH);
  doc.text((subTotal || 0).toFixed(2), cx + wTot - 2, y + 4.5, { align: "right" });

  y += cellH + 2;

  // IN WORDS
  const words = totals?.totalInWords || totals?.amountInWords || "AED Zero Only";
  doc.setFont("helvetica", "normal");
  doc.rect(tableX, y, tableW, cellH);
  doc.text(`IN WORDS : ${words}`, tableX + 2, y + 4.5);
  y += cellH + 2;

  // PACKING / SHIPPING
  // Two equal cells
  const halfW = tableW / 2;

  // Left cell
  doc.rect(tableX, y, halfW, cellH * 2);
  doc.setFont("helvetica", "bold");
  doc.text("PACKING DETAILS:", tableX + 2, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(String(header.packingDetails || ""), tableX + 2, y + 10, { maxWidth: halfW - 4 });

  // Right cell
  doc.rect(tableX + halfW, y, halfW, cellH * 2);
  doc.setFont("helvetica", "bold");
  doc.text("SHIPPING MARKS:", tableX + halfW + 2, y + 5);
  doc.setFont("helvetica", "normal");
  const mk = [header.buyer || "", header.buyerAddress || ""].filter(Boolean).join("\n");
  doc.text(mk, tableX + halfW + 2, y + 10, { maxWidth: halfW - 4 });

  doc.save(`Invoice_${header.salesOrderNo || "Export"}.pdf`);
}
