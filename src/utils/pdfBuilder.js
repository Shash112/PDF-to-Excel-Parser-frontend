// pdfBuilders.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** Shared helpers */
//const mm = v => v; // we’ll use "mm" units in jsPDF ctor
const A4_W = 210;  // mm
const L = 14;      // left margin
const R = 14;      // right margin
const T = 14;      // top margin
const LINE = 0.2;  // thin rule

async function getBase64Logo() {
  try {
    const response = await fetch("/logo.png", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Logo fetch failed: ${response.status}`);
    const blob = await response.blob();
    const reader = new FileReader();
    return await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("❌ Logo fetch failed:", err);
    return null;
  }
}

function safeY(doc, y, increment = 8) {
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm for A4
  if (y + increment > pageHeight - 10) { // keep 10mm bottom margin
    doc.addPage();
    return 20; // new top margin for next page
  }
  return y;
}


async function headerBlock(doc, { header, title, uniqueHsCodes }) {
  const A4_W = 210;
  const L = 15;
  const R = 15;
  const T = 15;
  const LINE = 0.2;

  // === 1️⃣ COMPANY HEADER ===
  const companyName = "MSG OILFIELD EQUIPMENT TRADING LLC";
  const companyAddress = [
    "Dubai Industrial City (DIC), Phase 1",
    "Sai Shuaib 2, Warehouse No: J-04, Dubai, United Arab Emirates",
    "TRN No: 100518964000003"
  ];


    const logoBase64 = await getBase64Logo();
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, "PNG", L, T, 30, 15);
        } catch (e) {
            console.warn("⚠️ addImage failed:", e);
        }
    }


  // Company details (center-right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(companyName, A4_W / 2, T + 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  companyAddress.forEach((line, i) => {
    doc.text(line, A4_W / 2 , T + 10 + i * 5, { align: "center" });
  });

  // === 2️⃣ DOCUMENT TITLE ===
  const titleY = T + 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), A4_W / 2, titleY, { align: "center" });

  // === 3️⃣ HEADER FIELDS (Buyer, SO No, etc.) ===
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const y0 = titleY + 8;
  const colGap = 105;
  const xLeft = L;
  const xRight = L + colGap;

  const writeField = (label, x, y, wrapWidth = 80) => { 
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(String(label || ""), wrapWidth);
    doc.text(wrapped, x, y);
    return y + (wrapped.length - 1) * 4;
  };

  const writeFieldStacked = (label, value, x, y, wrapWidth = 80) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, x, y);
    doc.setFont("helvetica", "normal");

    const wrapped = doc.splitTextToSize(String(value || ""), wrapWidth);
    doc.text(wrapped, x, y + 5); // print directly below label
    return y + 5 + (wrapped.length - 1) * 4;
  };


  let y = y0;
  let yRight = y0;

  // LEFT COLUMN (Buyer Info)
  y = writeFieldStacked("CONSIGNEE", header?.buyer, xLeft, y);
  if (header?.buyerAddress) {
    const addrLines = doc.splitTextToSize(header.buyerAddress, 80);
    doc.text(addrLines, xLeft, y + 4);
    y += addrLines.length * 4 + 2;
  }

  // RIGHT COLUMN (PO, Invoice, Date)
  yRight = writeField(`DATE: ${header?.orderDate}`, xRight, yRight);
  yRight = writeField(`INV. NO: ${header?.salesOrderNo}`, xRight, yRight + 6);
  yRight = writeField(`PO NUMBER: ${header?.refNo}`, xRight, yRight + 6);

  // Second Row
  y += 15;
  y = writeField(`MODE OF SHIPMENT: ${header?.modeOfShipment}`, xLeft, y);
  y = writeField(`FREIGHT TERMS: ${header?.freightTerms}`, xLeft, y + 6);
  y = writeField(`PLACE OF LOADING: ${header?.placeOfLoading}`, xLeft, y + 6);
  y = writeField(`PLACE OF DISCHARGE: ${header?.placeOfDischarge}`, xLeft, y + 6);

  let yR2 = yRight + 25;
  yR2 = writeFieldStacked("SOLD TO / INVOICED TO", header?.buyer, xRight, yR2);
  if (header?.buyerAddress) {
    const addrLines2 = doc.splitTextToSize(header.buyerAddress, 80);
    doc.text(addrLines2, xRight, yR2 + 4);
    yR2 += addrLines2.length * 4 + 2;
  }

  // Third Row
  const hsCodes = (uniqueHsCodes || []).join(", ") || "-";
  const origins = Array.isArray(header.uniqueOrigin) ? (header.uniqueOrigin).join(", ") : header.uniqueOrigin ? header.uniqueOrigin : "" 

  const finalY = Math.max(y, yR2) + 12;

  doc.setFont("helvetica", "bold");
  doc.text("COUNTRY / PLACE OF ORIGIN:", xLeft, finalY);
  doc.setFont("helvetica", "normal");
  const originWrapped = doc.splitTextToSize(origins, 80);
  doc.text(originWrapped, xLeft, finalY + 6);

  doc.setFont("helvetica", "bold");
  doc.text("HS CODES IN THIS SHIPMENT:", xRight, finalY);
  doc.setFont("helvetica", "normal");
  const hsWrapped = doc.splitTextToSize(hsCodes, 80);
  doc.text(hsWrapped, xRight, finalY + 6);

  return finalY + 20;
}



function groupTotalsBlock(doc, y, { net, gross }) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Group Net Weight: ${Number(net || 0).toFixed(2)} KGS`, A4_W - R, y, { align: "right" });
  doc.text(`Group Gross Weight: ${Number(gross || 0).toFixed(2)} KGS`, A4_W - R, y + 5, { align: "right" });
  return y + 10;
}

function footerBlocks(doc, y, { packingDetails, shippingMarks,totalCbm =0.00 }) {
  y = safeY(doc, y, 20); // ✅ Add here
  //const pageW = A4_W - L - R;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PACKING DETAILS:", L, y);
  doc.setFont("helvetica", "normal");
  const packWrapped = doc.splitTextToSize(String(packingDetails || ""), 160);

  doc.text(packWrapped, L, y + 5);
  y += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`TOTAL CBM (m³): ${totalCbm}`, L, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("SHIPPING MARKS:", L, y);
  doc.setFont("helvetica", "normal");
  // multi-line shipping marks
  const shippingMarksWrapped = doc.splitTextToSize(String(shippingMarks || ""), 160);

  doc.text(shippingMarksWrapped, L, y + 5);
  return y + 8;
}

/** ============================
 *  PACKING LIST (vector, editable)
 *  Mirrors your PackingListPreview structure
 * ============================ */
export async function buildPackingListPDF(data) {
  const { header = {}, groups = [], items = [], totalCbm=0.00 } = data;
  // unique HS codes (same logic)
  const hsSet = new Set();
  items.forEach(it => it.hsCode && hsSet.add(it.hsCode));
  groups.forEach(g => (g.items || []).forEach(it => it.hsCode && hsSet.add(it.hsCode)));
  const uniqueHsCodes = Array.from(hsSet);

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

  // Header
  let cursorY = await headerBlock(doc, { header, title: "PACKING LIST", uniqueHsCodes });

  const tableHead = [
    ["SR", "DESCRIPTION", "QTY", "UOM", "H.S. CODE", "ORIGIN", "UNIT WT / KGS", "TOTAL WT / KGS"]
  ];

  const renderItemsTable = (rows, startY) => {
    autoTable(doc, {
      head: tableHead,
      body: rows,
      startY,
      margin: { left: L, right: R },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 1.5, lineWidth: 0.2 },
      headStyles: { fillColor: [240, 240, 240], textColor: 20, halign: "center" },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },     // SR
        1: { cellWidth: 60 },                        // DESCRIPTION
        2: { cellWidth: 15, halign: "center" },      // QTY
        3: { cellWidth: 15, halign: "center" },      // UOM
        4: { cellWidth: 22, halign: "center" },      // HS
        5: { cellWidth: 20, halign: "center" },      // ORIGIN
        6: { cellWidth: 20, halign: "right" },       // UNIT WT
        7: { cellWidth: 20, halign: "right" },       // TOTAL WT
      },
    });
    return doc.lastAutoTable.finalY;
  };

  if ((groups || []).length === 0) {
    // Non-grouped table (like your non-group branch)
    const rows = (items || []).map((it, i) => {
      const q = parseFloat(it.qty || 0) || 0;
      const uw = parseFloat(it.unitWeight || 0) || 0;
      const tw = q * uw;
      return [
        i + 1,
        it.description || "",
        String(it.qty ?? ""),
        it.unit || "",
        it.hsCode || "",
        it.customOrigin?.trim() || it.origin || "—",
        uw ? uw.toFixed(2) : "—",
        tw ? tw.toFixed(2) : "—",
      ];
    });
    cursorY = renderItemsTable(rows, cursorY + 2);
  } else {
    // Grouped tables (title + table + group totals)
    groups.forEach((g) => {
      // Group header line with CBM
      const title = g.cbm ? `${g.name} (${Number(g.cbm).toFixed(3)} m³)` : `${g.name} (No dimensions)`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(title, L, cursorY);
      cursorY += 5;

      const rows = (g.items || []).map((it, i) => {
        const q = parseFloat(it.qty || 0) || 0;
        const uw = parseFloat(it.unitWeight || 0) || 0;
        const tw = q * uw;
        return [
          i + 1,
          it.description || "",
          String(it.qty ?? ""),
          it.unit || "",
          it.hsCode || "",
          it.customOrigin?.trim() || it.origin || "—",
          uw ? uw.toFixed(2) : "—",
          tw ? tw.toFixed(2) : "—",
        ];
      });

      cursorY = renderItemsTable(rows, cursorY + 1);
      cursorY = groupTotalsBlock(doc, cursorY + 4, {
        net: g.netWeight,
        gross: g.grossWeight,
      });

      // Add space between groups
      cursorY += 6;

      // If we are near page end, autoTable will paginate; but add a soft spacer
      cursorY = safeY(doc, cursorY, 15);
    });
  }
  cursorY += 18;
  cursorY = safeY(doc, cursorY, 20);  // ✅ Add this line


  // Totals (bottom)
  const totalNet = Number(
    (groups || []).reduce((s, g) => s + (parseFloat(g.netWeight || 0) || 0), 0)
  ).toFixed(2);

  const totalGross = Number(
    (groups || []).reduce((s, g) => s + (parseFloat(g.grossWeight || 0) || 0), 0)
  ).toFixed(2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Total Net Weight: ${totalNet} KGS`, A4_W - R, cursorY + 6, { align: "right" });
  doc.text(`Total Gross Weight: ${totalGross} KGS`, A4_W - R, cursorY + 12, { align: "right" });
  cursorY += 18;
  cursorY = safeY(doc, cursorY, 20);

  // Footer blocks
  cursorY = footerBlocks(doc, cursorY, {
    packingDetails: header.packingDetails,
    shippingMarks: [header.buyer, header.buyerAddress].filter(Boolean).join("\n"),
    totalCbm
  });

  return doc;
}

/** ============================
 *  INVOICE (vector, editable)
 *  Mirrors your InvoicePreview structure
 * ============================ */
export async function buildInvoicePDF(data) {
  const { header = {}, items = [], totals = {}, totalCbm=0.00 } = data;

  // unique HS codes (same logic)
  const hsSet = new Set();
  items.forEach(it => it.hsCode && hsSet.add(it.hsCode));
  const uniqueHsCodes = Array.from(hsSet);

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let cursorY = await headerBlock(doc, { header, title: "INVOICE", uniqueHsCodes });

  const head = [[
    "SR", "DESCRIPTION", "QTY", "UOM", "H.S. CODE", "ORIGIN", "UNIT PRICE / AED", "TOTAL VALUE / AED"
  ]];

  const body = (items || []).map((it, i) => [
    i + 1,
    it.description || "",
    String(it.qty ?? ""),
    it.unit || "",
    it.hsCode || "",
    it.customOrigin?.trim() || it.origin || "—",
    String(it.rate ?? ""),
    String(it.amount ?? "")
  ]);

  // Items Table
  autoTable(doc, {
    head,
    body,
    startY: cursorY,
    margin: { left: L, right: R },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 1.5, lineWidth: 0.2 },
    headStyles: { fillColor: [240, 240, 240], textColor: 20, halign: "center" },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 60 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 20, halign: "right" },
    },
  });

  cursorY = doc.lastAutoTable.finalY + 4;
  cursorY = safeY(doc, cursorY, 25);

  // Totals
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Total: ${totals?.subTotal || "0.00"} AED`, A4_W - R, cursorY, { align: "right" });
  cursorY += 10;
  cursorY = safeY(doc, cursorY, 25);

  // TOTAL VALUE TABLE
  const totalQty = (items || []).reduce((s, it) => s + (parseFloat(it.qty || 0) || 0), 0);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: L, right: R },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 1.6, lineWidth: 0.2 },
    head: [],
    body: [[
      { content: "TOTAL VALUE IN QTY:", styles: { halign: "right", fillColor: [240,240,240], fontStyle: "bold" } },
      { content: totalQty.toFixed(2), styles: { halign: "center", fillColor: [240,240,240], fontStyle: "bold" } },
      { content: "Nos", styles: { halign: "center", fillColor: [240,240,240], fontStyle: "bold" } },
      { content: "TOTAL VALUE IN AED:", styles: { halign: "center", fillColor: [240,240,240], fontStyle: "bold" } },
      { content: String(totals?.subTotal || "0.00"), styles: { halign: "right", fillColor: [240,240,240], fontStyle: "bold" } },
    ]],
    columns: [
      { header: "", dataKey: "lbl" },
      { header: "", dataKey: "qty" },
      { header: "", dataKey: "uom" },
      { header: "", dataKey: "ccy" },
      { header: "", dataKey: "amt" },
    ],
    columnStyles: {
      0: { cellWidth: 51 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 46 },
      4: { cellWidth: 35 },
    }
  });

  cursorY = doc.lastAutoTable.finalY + 2;
  cursorY = safeY(doc, cursorY, 25);

    // IN WORDS line
  doc.setFont("helvetica", "bold");
  doc.text("IN WORDS :", L, cursorY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(String(totals?.subTotalInWords || ""), L + 25, cursorY + 5);
  cursorY += 12;
  cursorY = safeY(doc, cursorY, 25); 

  // Helper for wrapped stacked fields
  const writeFieldStacked = (label, value, x, y, wrapWidth = 160) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, x, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(String(value || ""), wrapWidth);
    doc.text(wrapped, x, y + 5);
    return y + 5 + (wrapped.length - 1) * 4;
  };



  // PACKING DETAILS
  cursorY = writeFieldStacked("PACKING DETAILS", header?.packingDetails, L, cursorY);
    cursorY += 12;
  cursorY = safeY(doc, cursorY, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`TOTAL CBM (m³): ${totalCbm}`, L, cursorY);
      cursorY += 12;
  cursorY = safeY(doc, cursorY, 15);

  // SHIPPING MARKS
  const shipping = [header.buyer, header.buyerAddress].filter(Boolean).join("\n");
  cursorY = writeFieldStacked("SHIPPING MARKS", shipping, L, cursorY);
    cursorY += 12;
  cursorY = safeY(doc, cursorY, 15);

  return doc;
}

