import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PackingListPreview from "./PackingListPreview";
import InvoicePreview from "./InvoicePreview";
import { buildExcelHeader } from "../utils/buildExcelHeader";
import numberToWords from "number-to-words";

export default function PreviewTabs({ data, onChange, onPrev }) {
  const [activeTab, setActiveTab] = useState("PL"); // PL | INV
  const { header = {}, items = [], groups = [], totals = {} } = data;

  // ✅ Compute unique HS Codes (used for both sheets)
  const uniqueHsCodes = useMemo(() => {
    const hsSet = new Set();
    (items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode));
    (groups || []).forEach((g) =>
      (g.items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode))
    );
    return Array.from(hsSet);
  }, [items, groups]);

  // 🧾 Export Both Sheets (PL + INV) into one Excel
  const exportBothToExcel = () => {
    const wb = XLSX.utils.book_new();

    /** =============================
     *  🧾 PACKING LIST SHEET
     * ============================= */
    const pl_data = [
      ...buildExcelHeader(header, uniqueHsCodes, "PACKING LIST"),
      ["SR NO", "DESCRIPTION", "QTY", "UOM", "H.S. CODE", "ORIGIN", "UNIT WEIGHT / KGS", "TOTAL WEIGHT / KGS"],
    ];

    let globalNet = 0;
    let globalGross = 0;

    if ((groups || []).length > 0) {
      groups.forEach((g) => {
        pl_data.push([]);
        pl_data.push([`${g.name}`]);

        let groupNet = 0;
        (g.items || []).forEach((it, idx) => {
          const qty = parseFloat(it.qty || 0);
          const uw = parseFloat(it.unitWeight || 0);
          const tw = +(qty * uw).toFixed(2);
          groupNet += tw;

          pl_data.push([
            idx + 1,
            it.description,
            it.qty,
            it.unit,
            it.hsCode,
            it.origin || "UAE",
            it.unitWeight || "",
            tw,
          ]);
        });

        const groupGross = +(groupNet * 1.04).toFixed(2);
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
          it.origin || "UAE",
          it.unitWeight || "",
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
    pl_data.push([]);

    const wsPL = XLSX.utils.aoa_to_sheet(pl_data);
    wsPL["!cols"] = [
      { wch: 6 },
      { wch: 80 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPL, "Packing_List");

    /** =============================
     *  💰 INVOICE SHEET
     * ============================= */
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
        it.origin || "UAE",
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
    inv_data.push([
    `IN WORDS : `+ (() => {
                        const total = parseFloat(
                            (totals?.total || "0").toString().replace(/,/g, "")
                        );
                        const words = numberToWords.toWords(total);
                        return `AED ${words.charAt(0).toUpperCase() + words.slice(1)} Only`;
                        })(),
    ]);
    inv_data.push([]);
    inv_data.push([
    "PACKING DETAILS:",
    header.packingDetails || "",
    ]);
    inv_data.push([]);
    inv_data.push(["SHIPPING MARKS:", header.buyer || ""]);

    const wsINV = XLSX.utils.aoa_to_sheet(inv_data);
    wsINV["!cols"] = wsPL["!cols"];
    XLSX.utils.book_append_sheet(wb, wsINV, "Invoice");

    /** ✅ Final Save */
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      `PL_INV_${header.salesOrderNo || "Export"}.xlsx`
    );
  };

  return (
    <div className="bg-white border rounded-lg shadow p-6 w-full">
      {/* Tabs Header */}
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
              {tab === "PL" ? "🧾 Packing List" :"💰 Invoice" }
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPrev}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ◀ Back
          </button>
          <button
            onClick={exportBothToExcel}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ⬇ Export Both (Excel)
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === "PL" ? (
        <PackingListPreview data={data} onChange={onChange} />
      ) : (
        <InvoicePreview data={data} onChange={onChange} />
      )}
    </div>
  );
}
