// utils/pdf/generatePackingListPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** Small util: safe number */
const n = (v, d = 0) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : d;
};

/** Renders the shared header block (matches CommonHeader content) */
function drawCommonHeader(doc, header = {}, uniqueHsCodes = [], y = 12, pageW = 210, margin = 14) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(header.documentTitle || "PACKING LIST", margin, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const leftX = margin;
  const rightX = pageW - margin - 80; // right column x start
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

  // HS Codes (single line)
  const hsLine = uniqueHsCodes.length ? uniqueHsCodes.join(", ") : "—";
  doc.setFont("helvetica", "bold"); doc.text("HS Codes:", leftX, cy);
  doc.setFont("helvetica", "normal"); doc.text(hsLine, leftX + 26, cy, { maxWidth: pageW - margin - (leftX + 26) });
  cy += 4;

  // subtle divider
  doc.setDrawColor(200);
  doc.line(margin, cy + 3, pageW - margin, cy + 3);

  return cy + 8; // return next y
}

/** Table column widths tuned to your HTML layout (A4 portrait) */
const PL_COLS = [
  { header: "SR", dataKey: "sr", cellWidth: 10, halign: "center" },
  { header: "DESCRIPTION", dataKey: "description", cellWidth: 82, halign: "left" },
  { header: "QTY", dataKey: "qty", cellWidth: 14, halign: "center" },
  { header: "UOM", dataKey: "unit", cellWidth: 14, halign: "center" },
  { header: "H.S. CODE", dataKey: "hs", cellWidth: 20, halign: "center" },
  { header: "ORIGIN", dataKey: "origin", cellWidth: 18, halign: "center" },
  { header: "UNIT WT / KGS", dataKey: "unitWt", cellWidth: 24, halign: "center" },
  { header: "TOTAL WT / KGS", dataKey: "totalWt", cellWidth: 24, halign: "center" },
];

/** Build table rows for a group (matches table in PackingListPreview) */
function buildPLRows(items = []) {
  return items.map((it, i) => {
    const qty = n(it.qty);
    const uw = n(it.unitWeight);
    const tw = qty * uw;
    return {
      sr: String(i + 1),
      description: it.description ?? "",
      qty: qty ? qty : "",
      unit: it.unit ?? "",
      hs: it.hsCode ?? "",
      origin: it.origin ?? "",
      unitWt: uw ? uw.toFixed(2) : "—",
      totalWt: tw ? tw.toFixed(2) : "—",
    };
  });
}

/** PUBLIC: Generate Packing List PDF (editable text; pixel-accurate table) */
export function generatePackingListPDF(data) {
  const { header = {}, groups = [], items = [] } = data || {};
  const uniqueHs = Array.from(new Set([
    ...((items || []).map(i => i.hsCode).filter(Boolean)),
    ...((groups || []).flatMap(g => (g.items || []).map(i => i.hsCode)).filter(Boolean)),
  ]));

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  let y = drawCommonHeader(doc, header, uniqueHs, 12, pageW, margin);

  const hasGroups = (groups || []).length > 0;
  let totalNet = 0;
  let totalGross = 0;

  const tableHeadStyles = {
    fillColor: [243, 244, 246], // tailwind gray-100
    textColor: [0, 0, 0],
    halign: "center",
    lineColor: [156, 163, 175],
    lineWidth: 0.2,
    fontStyle: "bold",
    fontSize: 9,
  };
  const tableBodyStyles = {
    fontSize: 9,
    cellPadding: 2,
    lineColor: [156, 163, 175],
    lineWidth: 0.2,
    valign: "middle",
  };

  if (!hasGroups) {
    // Single table (no groups)
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [PL_COLS.map(c => c.header)],
      body: buildPLRows(items).map(r => Object.values(r)),
      styles: tableBodyStyles,
      headStyles: tableHeadStyles,
      columnStyles: PL_COLS.reduce((acc, c, idx) => {
        acc[idx] = { cellWidth: c.cellWidth, halign: c.halign || "center" };
        return acc;
      }, {}),
      didParseCell: (data) => {
        // align numbers right if needed
        const idx = data.column.index;
        if (idx >= 2 && idx <= 7 && data.section === "body") {
          data.cell.styles.halign = idx >= 2 ? "center" : "left";
        }
      },
    });

    // Totals (derive net/gross similar to screen)
    // Net = sum(row totals); Gross ~ +4% when not grouped (as per your code)
    const body = buildPLRows(items);
    totalNet = body.reduce((s, r) => s + n(r.totalWt), 0);
    totalGross = +(totalNet * 1.04).toFixed(2);

    y = doc.lastAutoTable.finalY + 4;
  } else {
    // For each group, render a label + table + group totals
    for (const g of groups) {
      // Group label row (name + CBM)
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      const groupLine = g.cbm ? `${g.name} (${n(g.cbm).toFixed(3)} m³)` : `${g.name} (No dimensions)`;
      doc.text(groupLine, margin, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [PL_COLS.map(c => c.header)],
        body: buildPLRows(g.items || []).map(r => Object.values(r)),
        styles: tableBodyStyles,
        headStyles: tableHeadStyles,
        columnStyles: PL_COLS.reduce((acc, c, idx) => {
          acc[idx] = { cellWidth: c.cellWidth, halign: c.halign || "center" };
          return acc;
        }, {}),
      });

      y = doc.lastAutoTable.finalY + 2;

      // Group Net & Gross (use stored values to match preview)
      const gNet = n(g.netWeight);
      const gGross = n(g.grossWeight);
      totalNet += gNet;
      totalGross += gGross;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const textRightX = pageW - margin;
      doc.text(`Group Net Weight: ${gNet.toFixed(2)} KGS`, textRightX, y, { align: "right" });
      y += 5;
      doc.text(`Group Gross Weight: ${gGross.toFixed(2)} KGS`, textRightX, y, { align: "right" });
      y += 8;

      // Page break safety
      if (y > pageH - 40) {
        doc.addPage();
        y = 12;
      }
    }
  }

  // Packing details + Shipping marks (exactly like preview)
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("PACKING DETAILS:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(String(header.packingDetails || ""), margin + 40, y, { maxWidth: pageW - margin - (margin + 40) });
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("SHIPPING MARKS:", margin, y);
  doc.setFont("helvetica", "normal");
  const marks = [header.buyer || "", header.buyerAddress || ""].filter(Boolean).join("\n");
  doc.text(marks || "", margin + 40, y, { maxWidth: pageW - margin - (margin + 40) });
  y += 12;

  // Grand totals
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(`Total Net Weight: ${n(totalNet).toFixed(2)} KGS`, pageW - margin, y, { align: "right" });
  y += 6;
  doc.text(`Total Gross Weight: ${n(totalGross).toFixed(2)} KGS`, pageW - margin, y, { align: "right" });

  doc.save(`PackingList_${header.salesOrderNo || "Export"}.pdf`);
}
