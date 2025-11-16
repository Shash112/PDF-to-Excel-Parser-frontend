// PreviewTabs.jsx
import React, { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

import PackingListPreview from "./PackingListPreview";
import InvoicePreview from "./InvoicePreview";
import { buildExcelHeader, styleExcelHeader } from "../utils/buildExcelHeader";
import { buildPackingListPDF, buildInvoicePDF } from "../utils/pdfBuilder"; // <-- add
import { hsCodeLabels } from "../constants/hsCode";

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
      console.error("❌ PDF generation failed (PL)");
    }
  };

  const handleDownloadINV = async () => {
    try {
      const doc = await buildInvoicePDF(data); // ✅ Await
      const fileName = `Invoice_${header.salesOrderNo || "Export"}.pdf`;
      doc.save(fileName);
      setShowDropdown(false);
    } catch (err) {
      console.error("❌ PDF generation failed (INV)");
    }
  };

  // Excel export unchanged
  const exportBothToExcel = () => {
    const wb = XLSX.utils.book_new();
    const origins = Array.isArray(header.uniqueOrigin)
      ? header.uniqueOrigin.join(", ")
      : header.uniqueOrigin || "";

    // ============================================================
    // 📦 PACKING LIST SHEET
    // ============================================================
    const pl_data = [
      ...buildExcelHeader(header, uniqueHsCodes, "PACKING LIST", origins),
      [
        "SR NO",
        "DESCRIPTION",
        "QTY",
        "UOM",
        "H.S. CODE",
        "ORIGIN",
        "UNIT WEIGHT / KGS",
        "TOTAL WEIGHT / KGS",
      ],
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
            it.customOrigin?.trim() || it.origin || "—",
            it.unitWeight,
            tw,
          ]);
        });

        globalNet += groupNet;
        globalGross += groupGross;

        pl_data.push(["", "", "", "", "", "", "Group Net Weight:", groupNet]);
        pl_data.push([
          "",
          "",
          "",
          "",
          "",
          "",
          "Group Gross Weight:",
          groupGross,
        ]);
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
          it.customOrigin?.trim() || it.origin || "—",
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
    pl_data.push([
      "SHIPPING MARKS",
      `${header.buyer} \n ${header.buyerAddress}`,
    ]);

    const wsPL = XLSX.utils.aoa_to_sheet(pl_data);
    styleExcelHeader(wsPL);

    // ✅ Column widths
    wsPL["!cols"] = [
      { wch: 20 },
      { wch: 80 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
      { wch: 24 },
      { wch: 28 },
      { wch: 28 },
    ];

    // ✅ Add cell styles (border, alignment, colors)
    const rangePL = XLSX.utils.decode_range(wsPL["!ref"]);
    for (let R = 8; R <= rangePL.e.r; ++R) {
      // ⬅ start from row 8 (zero-based)
      for (let C = rangePL.s.c; C <= rangePL.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = wsPL[addr];
        if (!cell) continue;

        const isHeader = R === 0; // Adjust if your table header row index changed
        const isTitle = R === 0; // keep unused or remove if not needed

        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: "AAAAAA" } },
            bottom: { style: "thin", color: { rgb: "AAAAAA" } },
            left: { style: "thin", color: { rgb: "AAAAAA" } },
            right: { style: "thin", color: { rgb: "AAAAAA" } },
          },
          alignment: {
            vertical: "center",
            horizontal: "center",
            wrapText: true,
          },
          font: {
            name: "Calibri",
            sz: isTitle ? 14 : isHeader ? 11 : 10,
            bold: isTitle || isHeader,
            color: { rgb: isHeader ? "FFFFFF" : "000000" },
          },
          fill: isHeader
            ? { fgColor: { rgb: "305496" } } // Blue header row
            : undefined,
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, wsPL, "Packing_List");

    // ============================================================
    // 💰 INVOICE SHEET
    // ============================================================
    const inv_data = [
      ...buildExcelHeader(header, uniqueHsCodes, "COMMERCIAL INVOICE", origins),
      [
        "SR NO",
        "DESCRIPTION",
        "QTY",
        "UOM",
        "H.S. CODE",
        "ORIGIN",
        "UNIT PRICE / AED",
        "TOTAL VALUE / AED",
      ],
    ];

    (items || []).forEach((it, idx) => {
      inv_data.push([
        idx + 1,
        it.description,
        it.qty,
        it.unit,
        it.hsCode,
        it.customOrigin?.trim() || it.origin || "—",
        it.rate,
        it.amount,
      ]);
    });

    inv_data.push([]);
    inv_data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Sub Total:",
      totals?.subTotal || "",
    ]);
    inv_data.push(["", "", "", "", "", "", "Total:", totals?.total || ""]);
    inv_data.push([]);
    inv_data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "TOTAL VALUE IN AED.",
      totals?.total || "",
    ]);
    inv_data.push([]);
    inv_data.push([
      `IN WORDS : ${totals?.totalInWords || totals?.amountInWords || ""}`,
    ]);
    inv_data.push([]);
    inv_data.push(["PACKING DETAILS:", header.packingDetails || ""]);
    inv_data.push([
      "SHIPPING MARKS:",
      `${header.buyer} \n ${header.buyerAddress}`,
    ]);

    const wsINV = XLSX.utils.aoa_to_sheet(inv_data);
    styleExcelHeader(wsINV);
    wsINV["!cols"] = wsPL["!cols"];

    const rangeINV = XLSX.utils.decode_range(wsINV["!ref"]);
    for (let R = rangeINV.s.r; R <= rangeINV.e.r; ++R) {
      for (let C = rangeINV.s.c; C <= rangeINV.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = wsINV[addr];
        if (!cell) continue;

        const isHeader = R === 0;
        const isTitle = R === 0;

        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: "AAAAAA" } },
            bottom: { style: "thin", color: { rgb: "AAAAAA" } },
            left: { style: "thin", color: { rgb: "AAAAAA" } },
            right: { style: "thin", color: { rgb: "AAAAAA" } },
          },
          alignment: {
            vertical: "center",
            horizontal: "center",
            wrapText: true,
          },
          font: {
            name: "Calibri",
            sz: isTitle ? 14 : isHeader ? 11 : 10,
            bold: isTitle || isHeader,
            color: { rgb: isHeader ? "FFFFFF" : "000000" },
          },
          fill: isHeader ? { fgColor: { rgb: "4472C4" } } : undefined,
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, wsINV, "Invoice");

    // ============================================================
    // 📄 HS CODE SHEET (Updated to list all items directly)
    // ============================================================
    const hs_data = [
      [
        "H. S. CODE",
        "DESCRIPTION",
        "COUNTRY OF ORIGIN",
        "PACKAGE",
        "",
        "",
        "NET WEIGHT / KGS",
        "GROSS WEIGHT / KGS",
        "CURRENCY",
        "",
      ],
      ["", "", "", "QTY", "TYPE", "PACKAGES", "", "", "TYPE", "VALUE"],
    ];

    // ✅ Initialize totals
    let totalQty = 0,
      totalValue = 0,
      totalNet = 0,
      totalGross = 0;

    // ✅ Loop through each item directly
    (items || []).forEach((it) => {
      const qty = parseFloat(it.qty || 0);
      const uw = parseFloat(it.unitWeight || 0);
      const itemNet = +(qty * uw).toFixed(2);
      
      const extra = (it.extraWeights || []).reduce((sum, e) => sum + e.diff, 0);

      const itemGross = +(itemNet + extra).toFixed(2);

      const value = parseFloat(it.amount || 0);

      hs_data.push([
        it.hsCode || "",
        it.hsLabel || hsCodeLabels[it.hsCode] || "",
        it.customOrigin?.trim() || it.origin || "—",
        qty,
        it.unit || "",
        "",
        // itemNet.toFixed(2),
        itemGross.toFixed(2),  // use itemGross instead of itemNet
        itemGross.toFixed(2),
        it.currency || "AED",
        value.toFixed(2),
      ]);

      totalQty += qty;
      totalValue += value;
      totalNet += itemNet;
      totalGross += itemGross;
    });

    // ✅ Add total row
    hs_data.push([
      "TOTAL",
      "",
      "",
      totalQty.toFixed(2),
      "PCS",
      `${header.totalPackages || 0} PACKAGE`,
      // totalNet.toFixed(2),
      totalGross.toFixed(2), // use totalGross instead of totalNet
      (Number(totalGross.toFixed(2)) +
        groups.reduce((sum, g) => sum + (parseFloat(g.boxWeight) || 0), 0)
      ).toFixed(2),
      "AED",
      totalValue.toFixed(2),
    ]);

    // ✅ Convert to sheet
    const wsHS = XLSX.utils.aoa_to_sheet(hs_data);
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

    // ✅ Style and borders
    const rangeHS = XLSX.utils.decode_range(wsHS["!ref"]);
    for (let R = rangeHS.s.r; R <= rangeHS.e.r; ++R) {
      for (let C = rangeHS.s.c; C <= rangeHS.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = wsHS[addr];
        if (!cell) continue;

        const isHeader = R <= 1;
        const isTitle = R === 0;

        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: "AAAAAA" } },
            bottom: { style: "thin", color: { rgb: "AAAAAA" } },
            left: { style: "thin", color: { rgb: "AAAAAA" } },
            right: { style: "thin", color: { rgb: "AAAAAA" } },
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          font: {
            name: "Calibri",
            sz: isTitle ? 13 : 10,
            bold: isTitle || isHeader,
            color: { rgb: isHeader ? "FFFFFF" : "000000" },
          },
          fill: isHeader ? { fgColor: { rgb: "2F5597" } } : undefined,
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, wsHS, "HS CODE");

    // ✅ Save workbook
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
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
                activeTab === tab
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {tab === "PL" ? "🧾 Packing List" : "💰 Invoice"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 relative">
          <button
            onClick={onPrev}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
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
                  <button
                    onClick={handleDownloadPL}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    🧾 Download Packing List (PDF)
                  </button>
                ) : (
                  <button
                    onClick={handleDownloadINV}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    💰 Download Invoice (PDF)
                  </button>
                )}
                <button
                  onClick={handleDownloadExcel}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
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
