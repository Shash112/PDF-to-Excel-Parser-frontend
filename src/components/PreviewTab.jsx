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
    const origins = Array.isArray(header.uniqueOrigin) ? (header.uniqueOrigin).join(", ") : header.uniqueOrigin ? header.uniqueOrigin : "" 

    const pl_data = [
      ...buildExcelHeader(header, uniqueHsCodes, "PACKING LIST", origins),
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
    pl_data.push(["SHIPPING MARKS", `${header.buyer} \n ${header.buyerAddress}`]);

    const wsPL = XLSX.utils.aoa_to_sheet(pl_data);
    wsPL["!cols"] = [
      { wch: 6 }, { wch: 80 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPL, "Packing_List");

    const inv_data = [
      ...buildExcelHeader(header, uniqueHsCodes, "COMMERCIAL INVOICE", origins),
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
    inv_data.push(["SHIPPING MARKS:", `${header.buyer} \n ${header.buyerAddress}`]);

    const wsINV = XLSX.utils.aoa_to_sheet(inv_data);
    wsINV["!cols"] = wsPL["!cols"];
    XLSX.utils.book_append_sheet(wb, wsINV, "Invoice");

    const hs_data = [
      ["H. S. CODE", "DESCRIPTION", "COUNTRY OF ORIGIN", "PACKAGE", "", "", "NET WEIGHT / KGS", "GROSS WEIGHT / KGS", "CURRENCY", ""],
      ["", "", "", "QTY", "TYPE", "PACKAGES", "", "","TYPE", "VALUE"],
    ];

    let totalQty = 0;
    let totalValue = 0;
    let totalNet = 0;
    let totalGross = 0;

    // 🧮 Step 1: Aggregate per item across all groups
    const itemWeightMap = {};

    (groups || []).forEach((g) => {
      const gNet = parseFloat(g.netWeight || 0);
      const gBox = parseFloat(g.boxWeight || 0);

      if (!g.items?.length || gNet === 0) return;

      g.items.forEach((it) => {
        const qty = parseFloat(it.qty || 0);
        const uw = parseFloat(it.unitWeight || 0);
        const itemNet = +(qty * uw).toFixed(2);

        // Skip invalids
        if (!itemNet) return;

        // proportionally distribute box weight
        const share = itemNet / gNet;
        const itemBoxShare = gBox * share;
        const itemGross = +(itemNet + itemBoxShare).toFixed(2);

        // aggregate partials
        if (!itemWeightMap[it.id]) {
          itemWeightMap[it.id] = {
            hsCode: it.hsCode || "",
            hsLabel: it.hsLabel || "",
            origin: it.origin || "",
            qty: 0,
            unit: it.unit || "",
            net: 0,
            gross: 0,
            currency: it.currency || "AED",
            value: 0,
          };
        }

        const record = itemWeightMap[it.id];
        record.qty += qty;
        record.net += itemNet;
        record.gross += itemGross;
        record.value += parseFloat(it.amount || 0);
      });
    });

    // 🧮 Step 2: Convert map to sheet rows
    Object.values(itemWeightMap).forEach((it) => {
      hs_data.push([
        it.hsCode,
        it.hsLabel,
        it.origin,
        it.qty,
        it.unit,
        "", // packages (optional)
        it.net.toFixed(2),
        it.gross.toFixed(2),
        it.currency,
        it.value.toFixed(2),
      ]);

      totalQty += it.qty;
      totalValue += it.value;
      totalNet += it.net;
      totalGross += it.gross;
    });

    // 🧮 Step 3: Add totals
    hs_data.push([
      "TOTAL",
      "",
      "",
      totalQty.toFixed(2),
      "PCS",
      `${header.totalPackages || 0} PACKAGE`,
      totalNet.toFixed(2),
      totalGross.toFixed(2),
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
      { wch: 14 },
      { wch: 15 },
      { wch: 10 },
      { wch: 14 },
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
