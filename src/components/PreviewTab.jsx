// PreviewTabs.jsx
import React, { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
// REMOVE html2canvas + raster path
// import html2canvas from "html2canvas-pro";
// import jsPDF from "jspdf";

import PackingListPreview from "./PackingListPreview";
import InvoicePreview from "./InvoicePreview";
import { buildExcelHeader } from "../utils/buildExcelHeader";
import { buildPackingListPDF, buildInvoicePDF } from "../utils/pdfBuilder"; // <-- add

export default function PreviewTabs({ data, onChange, onPrev }) {
  const [activeTab, setActiveTab] = useState("PL");
  const [showDropdown, setShowDropdown] = useState(false);
  const { header = {}, items = [], groups = [], totals = {} } = data;

  const plRef = useRef();
  const invRef = useRef();

  const uniqueHsCodes = useMemo(() => {
    const hsSet = new Set();
    (items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode));
    (groups || []).forEach((g) =>
      (g.items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode))
    );
    return Array.from(hsSet);
  }, [items, groups]);

  // NEW: vector export (editable)
  const handleDownloadPL = async () => {
try {
    const doc = await buildPackingListPDF(data); // ✅ Await
    const fileName = `PackingList_${header.salesOrderNo || "Export"}.pdf`;
    doc.save(fileName);
    setShowDropdown(false);
  } catch (err) {
    console.error("❌ PDF generation failed (PL):", err);
  }
  };

  const handleDownloadINV = async () => {
  try {
    const doc = await buildInvoicePDF(data); // ✅ Await
    const fileName = `Invoice_${header.salesOrderNo || "Export"}.pdf`;
    doc.save(fileName);
    setShowDropdown(false);
  } catch (err) {
    console.error("❌ PDF generation failed (INV):", err);
  }
  };

  // Excel export unchanged
  const exportBothToExcel = () => {
    const wb = XLSX.utils.book_new();
    const pl_data = [
      ...buildExcelHeader(header, uniqueHsCodes, "PACKING LIST"),
      ["SR NO", "DESCRIPTION", "QTY", "UOM", "H.S. CODE", "ORIGIN", "UNIT WEIGHT / KGS", "TOTAL WEIGHT / KGS"],
    ];

    let globalNet = 0;
    let globalGross = 0;

    if ((groups || []).length > 0) {
      groups.forEach((g) => {
        const groupNet = parseFloat(g.netWeight || 0);
        const groupGross = parseFloat(g.grossWeight || 0);

        pl_data.push([]);
        pl_data.push([`${g.name}`]);

        (g.items || []).forEach((it, idx) => {
          const qty = parseFloat(it.qty || 0);
          const uw = parseFloat(it.unitWeight || 0);
          const tw = +(qty * uw).toFixed(2);

          pl_data.push([
            idx + 1,
            it.description,
            it.qty,
            it.unit,
            it.hsCode,
            it.origin,
            it.unitWeight,
            tw,
          ]);
        });

        globalNet += groupNet;
        globalGross += groupGross;

        pl_data.push(["", "", "", "", "", "", "Group Net Weight:", groupNet]);
        pl_data.push(["", "", "", "", "", "", "Group Gross Weight:", groupGross]);
      });
    } else {
      (items || []).forEach((it, idx) => {
        const qty = parseFloat(it.qty || 0);
        const uw = parseFloat(it.unitWeight || 0);
        const tw = +(qty * uw).toFixed(2);
        globalNet += tw;

        pl_data.push([
          idx + 1,
          it.description,
          it.qty,
          it.unit,
          it.hsCode,
          it.origin,
          it.unitWeight,
          tw,
        ]);
      });
      globalGross = +(globalNet * 1.04).toFixed(2);
    }

    pl_data.push([]);
    pl_data.push(["", "", "", "", "", "", "TOTAL NET WEIGHT:", globalNet]);
    pl_data.push(["", "", "", "", "", "", "TOTAL GROSS WEIGHT:", globalGross]);
    pl_data.push([]);
    pl_data.push(["PACKING DETAILS", header.packingDetails || ""]);
    pl_data.push(["SHIPPING MARKS", header.buyer || ""]);

    const wsPL = XLSX.utils.aoa_to_sheet(pl_data);
    wsPL["!cols"] = [
      { wch: 6 }, { wch: 80 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPL, "Packing_List");

    const inv_data = [
      ...buildExcelHeader(header, uniqueHsCodes, "COMMERCIAL INVOICE"),
      ["SR NO", "DESCRIPTION", "QTY", "UOM", "H.S. CODE", "ORIGIN", "UNIT PRICE / AED", "TOTAL VALUE / AED"],
    ];

    (items || []).forEach((it, idx) => {
      inv_data.push([
        idx + 1,
        it.description,
        it.qty,
        it.unit,
        it.hsCode,
        it.origin,
        it.rate,
        it.amount,
      ]);
    });

    inv_data.push([]);
    inv_data.push(["", "", "", "", "", "", "Sub Total:", totals?.subTotal || ""]);
    inv_data.push(["", "", "", "", "", "", "Total:", totals?.total || ""]);
    inv_data.push([]);
    inv_data.push(["", "", "", "", "", "", "TOTAL VALUE IN AED.", totals?.total || ""]);
    inv_data.push([]);
    inv_data.push([`IN WORDS : ${totals?.totalInWords || totals?.amountInWords || ""}`]);
    inv_data.push([]);
    inv_data.push(["PACKING DETAILS:", header.packingDetails || ""]);
    inv_data.push(["SHIPPING MARKS:", header.buyer || ""]);

    const wsINV = XLSX.utils.aoa_to_sheet(inv_data);
    wsINV["!cols"] = wsPL["!cols"];
    XLSX.utils.book_append_sheet(wb, wsINV, "Invoice");

    // ✅ Build HS CODE Sheet (New)
const hs_data = [
  ["H. S. CODE", "DESCRIPTION", "COUNTRY OF ORIGIN", "PACKAGE", "", "", "NET WEIGHT / KGS", "GROSS WEIGHT / KGS", "CURRENCY", ""],
  ["", "", "", "QTY", "TYPE", "PACKAGES", "TYPE", "VALUE"],
];

// Compute totals
let totalQty = 0;
let totalValue = 0;
let totalPackages = 0;

// Build data rows
(items || []).forEach((it) => {
  const qty = parseFloat(it.qty || 0);
  const uw = parseFloat(it.unitWeight || 0);
  const netWeight = +(qty * uw).toFixed(2);
  const grossWeight = +(netWeight * 1.04).toFixed(2);
  const value = parseFloat(it.amount || 0);

  hs_data.push([
    it.hsCode || "",
    it.description || "",
    it.origin || "",
    qty || "",
    it.unit || "",
    it.packages || "",
    netWeight || "",
    grossWeight || "",
    it.currency || "AED",
    value || "",
  ]);

  totalQty += qty;
  totalValue += value;
  totalPackages += 1;
});

// Add totals row
hs_data.push([]);
hs_data.push([
  "TOTAL",
  "",
  "",
  totalQty,
  "PCS",
  `${totalPackages} PACKAGE`,
  "AED",
  totalValue.toFixed(2),
]);


const wsHS = XLSX.utils.aoa_to_sheet(hs_data);

// Set column widths
wsHS["!cols"] = [
  { wch: 12 },
  { wch: 40 },
  { wch: 20 },
  { wch: 8 },
  { wch: 8 },
  { wch: 12 },
  { wch: 10 },
  { wch: 15 },
];

// ✅ Append new HS CODE sheet
XLSX.utils.book_append_sheet(wb, wsHS, "HS CODE");


    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }),
      `PL_INV_${header.salesOrderNo || "Export"}.xlsx`
    );
  };

  const handleDownloadExcel = () => {
    exportBothToExcel();
    setShowDropdown(false);
  };

  return (
    <div className="bg-white border rounded-lg shadow p-6 w-full relative">
      <div className="flex justify-between mb-6 items-center">
        <div className="flex gap-2">
          {["PL", "INV"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg font-medium transition ${
                activeTab === tab ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {tab === "PL" ? "🧾 Packing List" : "💰 Invoice"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 relative">
          <button onClick={onPrev} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
            ◀ Back
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              ⬇ Export ▼
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white border rounded shadow-lg z-10">
                {activeTab === "PL" ? (
                  <button onClick={handleDownloadPL} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    🧾 Download Packing List (PDF)
                  </button>
                ) : (
                  <button onClick={handleDownloadINV} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    💰 Download Invoice (PDF)
                  </button>
                )}
                <button onClick={handleDownloadExcel} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                  📊 Download Both (Excel)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab previews unchanged (just for on-screen preview) */}
      <div className="relative">
        <div ref={plRef} className={activeTab === "PL" ? "block" : "hidden"}>
          <PackingListPreview data={data} onChange={onChange} />
        </div>
        <div ref={invRef} className={activeTab === "INV" ? "block" : "hidden"}>
          <InvoicePreview data={data} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
